"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Loader2, LocateFixed, Route } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMapsConfig } from "@/features/claims/hooks/useClaims";
import { useClaimDraftStore } from "@/features/claims/stores/useClaimDraftStore";
import { calculateDistance } from "@/shared/lib/api-client/claims";
import { reverseGeocode } from "@/shared/lib/api-client/geocode";

declare global {
  interface Window {
    google?: GoogleApi;
  }
}

interface GooglePlaceLike {
  formatted_address?: string;
  name?: string;
  geometry?: { location?: unknown };
}

interface GoogleAutocompleteLike {
  addListener: (eventName: "place_changed", handler: () => void) => void;
  getPlace: () => GooglePlaceLike;
}

interface GoogleMapLike {
  panTo: (location: unknown) => void;
  setZoom: (zoom: number) => void;
  fitBounds: (bounds: unknown) => void;
}

interface GoogleMarkerLike {
  setPosition: (position: unknown) => void;
}

interface GooglePolylineLike {
  setMap: (map: GoogleMapLike | null) => void;
}

interface GoogleApi {
  maps?: {
    Map: new (el: HTMLElement, options: Record<string, unknown>) => GoogleMapLike;
    Marker: new (options: { map?: GoogleMapLike; label?: string }) => GoogleMarkerLike;
    LatLng: new (lat: number, lng: number) => unknown;
    LatLngBounds: new () => {
      extend: (point: unknown) => void;
    };
    Polyline: new (options: {
      map: GoogleMapLike;
      path: unknown[];
      strokeColor: string;
      strokeOpacity: number;
      strokeWeight: number;
    }) => GooglePolylineLike;
    places?: {
      Autocomplete?: new (
        input: HTMLInputElement,
        options: Record<string, unknown>
      ) => GoogleAutocompleteLike;
    };
  };
}

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-js-sdk";
const ROUTE_DEBOUNCE_MS = 400;
/** Framer Motion step transition is ~300ms; map must resize after container gains real size */
const MAP_RESIZE_AFTER_MOTION_MS = 360;
let googleMapsScriptPromise: Promise<void> | null = null;

function resetGoogleMapsLoader() {
  googleMapsScriptPromise = null;
  document.getElementById(GOOGLE_MAPS_SCRIPT_ID)?.remove();
}

function triggerMapResize(mapInstance: GoogleMapLike) {
  const g = window.google?.maps;
  if (!g) return;
  const maps = g as typeof g & { event?: { trigger: (m: unknown, e: string) => void } };
  maps.event?.trigger(mapInstance, "resize");
}

function loadGoogleMapsScript(key: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"));
  }
  if (window.google?.maps) return Promise.resolve();
  if (googleMapsScriptPromise) return googleMapsScriptPromise;

  googleMapsScriptPromise = new Promise((resolve, reject) => {
    const fail = (err: Error) => {
      resetGoogleMapsLoader();
      reject(err);
    };

    const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.google?.maps) {
        resolve();
        return;
      }
      existing.remove();
    }

    const cbName = `__foGmaps_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const w = window as unknown as Record<string, unknown>;
    w[cbName] = () => {
      try {
        delete w[cbName];
      } catch {
        w[cbName] = undefined;
      }
      if (window.google?.maps) {
        resolve();
      } else {
        fail(new Error("Google Maps callback ran but google.maps is missing"));
      }
    };

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      key
    )}&libraries=places&callback=${encodeURIComponent(cbName)}`;
    script.onerror = () => {
      try {
        delete w[cbName];
      } catch {
        w[cbName] = undefined;
      }
      fail(new Error("Failed to load Google Maps script"));
    };
    document.head.appendChild(script);
  });

  return googleMapsScriptPromise;
}

function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: Array<{ lat: number; lng: number }> = [];

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dLat;

    result = 0;
    shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dLng;

    coordinates.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return coordinates;
}

interface RouteStepMapProps {
  /** Subclaim mileage rate (RM/km); used to sync `amount` when distance updates */
  mileageRate: number;
}

export function RouteStepMap({ mileageRate }: RouteStepMapProps) {
  const draft = useClaimDraftStore();
  const updateFormField = useClaimDraftStore((s) => s.updateFormField);
  const { data: mapsConfig, isLoading: mapsConfigLoading, isError: mapsConfigError } = useMapsConfig();

  /** Callback ref state so map init runs after the container mounts (step 4 is conditionally rendered). */
  const [mapHost, setMapHost] = useState<HTMLDivElement | null>(null);
  const mapResizeObserverRef = useRef<ResizeObserver | null>(null);
  const mapMotionResizeTimerRef = useRef<number | null>(null);
  const fromInputRef = useRef<HTMLInputElement | null>(null);
  const toInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<GoogleMapLike | null>(null);
  const markersRef = useRef<{ from?: GoogleMarkerLike; to?: GoogleMarkerLike }>({});
  const routePolylineRef = useRef<GooglePolylineLike | null>(null);
  const syncGenerationRef = useRef(0);

  const [isMapReady, setIsMapReady] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const [fromLocation, setFromLocation] = useState(String(draft.formData.fromLocation ?? ""));
  const [toLocation, setToLocation] = useState(String(draft.formData.toLocation ?? ""));

  const [debouncedFrom, setDebouncedFrom] = useState("");
  const [debouncedTo, setDebouncedTo] = useState("");

  const distanceText = useMemo(() => {
    const value = String(draft.formData.distance ?? "").trim();
    return value ? `${value} km` : "—";
  }, [draft.formData.distance]);

  useEffect(() => {
    setFromLocation(String(draft.formData.fromLocation ?? ""));
    setToLocation(String(draft.formData.toLocation ?? ""));
  }, [draft.formData.fromLocation, draft.formData.toLocation]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedFrom(fromLocation.trim());
      setDebouncedTo(toLocation.trim());
    }, ROUTE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [fromLocation, toLocation]);

  useLayoutEffect(() => {
    const key = mapsConfig?.key?.trim();
    if (!key || !mapHost) return;

    let cancelled = false;
    loadGoogleMapsScript(key)
      .then(() => {
        if (cancelled || !mapHost || !window.google?.maps || mapRef.current) return;

        const googleMaps = window.google.maps;
        const mapInstance = new googleMaps.Map(mapHost, {
          center: { lat: 3.139, lng: 101.6869 },
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        mapRef.current = mapInstance;

        const attachAutocomplete = (input: HTMLInputElement | null, which: "from" | "to") => {
          if (!input) return;
          try {
            const AutocompleteCtor = googleMaps.places?.Autocomplete;
            if (typeof AutocompleteCtor !== "function") {
              return;
            }
            const autocomplete = new AutocompleteCtor(input, {
              fields: ["formatted_address", "geometry", "name"],
            });
            autocomplete.addListener("place_changed", () => {
              const place = autocomplete.getPlace();
              const text = place.formatted_address || place.name || "";
              if (!text) return;
              if (which === "from") {
                setFromLocation(text);
                updateFormField("fromLocation", text);
                if (place.geometry?.location) {
                  if (!markersRef.current.from) {
                    markersRef.current.from = new googleMaps.Marker({ map: mapInstance, label: "A" });
                  }
                  markersRef.current.from.setPosition(place.geometry.location);
                  mapInstance.panTo(place.geometry.location);
                }
              } else {
                setToLocation(text);
                updateFormField("toLocation", text);
                if (place.geometry?.location) {
                  if (!markersRef.current.to) {
                    markersRef.current.to = new googleMaps.Marker({ map: mapInstance, label: "B" });
                  }
                  markersRef.current.to.setPosition(place.geometry.location);
                }
              }
            });
          } catch {
            /* Legacy Autocomplete may be unavailable with newer Maps loaders; map + manual address entry still work. */
          }
        };

        attachAutocomplete(fromInputRef.current, "from");
        attachAutocomplete(toInputRef.current, "to");

        mapResizeObserverRef.current?.disconnect();
        mapResizeObserverRef.current = new ResizeObserver(() => {
          if (cancelled || !mapRef.current) return;
          triggerMapResize(mapRef.current);
        });
        mapResizeObserverRef.current.observe(mapHost);

        triggerMapResize(mapInstance);
        requestAnimationFrame(() => {
          if (!cancelled && mapRef.current) triggerMapResize(mapRef.current);
        });
        if (mapMotionResizeTimerRef.current) {
          clearTimeout(mapMotionResizeTimerRef.current);
        }
        mapMotionResizeTimerRef.current = window.setTimeout(() => {
          mapMotionResizeTimerRef.current = null;
          if (!cancelled && mapRef.current) triggerMapResize(mapRef.current);
        }, MAP_RESIZE_AFTER_MOTION_MS);

        if (!cancelled) {
          setIsMapReady(true);
        }
      })
      .catch(() => {
        toast.error("Unable to load Google Maps. Please refresh and try again.");
      });

    return () => {
      cancelled = true;
      if (mapMotionResizeTimerRef.current) {
        clearTimeout(mapMotionResizeTimerRef.current);
        mapMotionResizeTimerRef.current = null;
      }
      mapResizeObserverRef.current?.disconnect();
      mapResizeObserverRef.current = null;
    };
  }, [mapsConfig?.key, mapHost, updateFormField]);

  const computeRouteViaRoutesApi = useCallback(
    async (
      apiKey: string,
      origin: string,
      destination: string,
      signal?: AbortSignal
    ): Promise<{ encodedPolyline: string | null }> => {
      const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "routes.polyline.encodedPolyline",
        },
        body: JSON.stringify({
          origin: { address: origin },
          destination: { address: destination },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_UNAWARE",
          languageCode: "en-US",
          units: "METRIC",
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error("Routes API request failed");
      }

      const payload = (await response.json()) as {
        routes?: Array<{
          polyline?: { encodedPolyline?: string };
        }>;
      };
      const route = payload.routes?.[0];
      return {
        encodedPolyline: route?.polyline?.encodedPolyline ?? null,
      };
    },
    []
  );

  useEffect(() => {
    const apiKey = mapsConfig?.key?.trim();
    if (!debouncedFrom || !debouncedTo || !apiKey || !isMapReady) {
      routePolylineRef.current?.setMap(null);
      routePolylineRef.current = null;
      return;
    }

    const gen = ++syncGenerationRef.current;
    const controller = new AbortController();

    setIsCalculating(true);

    updateFormField("fromLocation", debouncedFrom);
    updateFormField("toLocation", debouncedTo);

    (async () => {
      try {
        const [distanceResult, routesResult] = await Promise.allSettled([
          calculateDistance(debouncedFrom, debouncedTo),
          computeRouteViaRoutesApi(apiKey, debouncedFrom, debouncedTo, controller.signal),
        ]);

        if (gen !== syncGenerationRef.current) return;

        if (distanceResult.status === "fulfilled" && distanceResult.value != null) {
          const ceiled = Math.ceil(distanceResult.value);
          updateFormField("distance", String(ceiled));
          updateFormField("amount", (ceiled * mileageRate).toFixed(2));
        } else {
          toast.error("Unable to calculate distance. Check addresses or try again.");
        }

        if (gen !== syncGenerationRef.current) return;

        if (routesResult.status === "fulfilled") {
          const { encodedPolyline } = routesResult.value;
          if (mapRef.current && window.google?.maps && encodedPolyline) {
            const googleMaps = window.google.maps;
            const points = decodePolyline(encodedPolyline);
            const latLngPath = points.map((p) => new googleMaps.LatLng(p.lat, p.lng));

            routePolylineRef.current?.setMap(null);
            routePolylineRef.current = new googleMaps.Polyline({
              map: mapRef.current,
              path: latLngPath,
              strokeColor: "#2563eb",
              strokeOpacity: 0.9,
              strokeWeight: 5,
            });

            const bounds = new googleMaps.LatLngBounds();
            latLngPath.forEach((point) => bounds.extend(point));
            mapRef.current.fitBounds(bounds);
          }
        } else {
          const err = routesResult.reason;
          const isAbort = err instanceof Error && err.name === "AbortError";
          if (!isAbort) {
            toast.error("Could not draw route on map. Distance may still be updated.");
          }
        }
      } finally {
        if (gen === syncGenerationRef.current) {
          setIsCalculating(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [
    debouncedFrom,
    debouncedTo,
    mapsConfig?.key,
    isMapReady,
    mileageRate,
    updateFormField,
    computeRouteViaRoutesApi,
  ]);

  const useCurrentLocationAsFrom = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        if (mapRef.current && window.google?.maps) {
          const point = new window.google.maps.LatLng(lat, lng);
          mapRef.current.panTo(point);
          mapRef.current.setZoom(15);
          if (!markersRef.current.from) {
            markersRef.current.from = new window.google.maps.Marker({ map: mapRef.current, label: "A" });
          }
          markersRef.current.from.setPosition(point);
        }

        const locationName = await reverseGeocode(lat, lng);
        if (locationName) {
          setFromLocation(locationName);
          updateFormField("fromLocation", locationName);
          toast.success("Current location captured.");
        } else {
          toast.error("Current location found, but address lookup failed.");
        }
      },
      () => {
        toast.error("Unable to get current location.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  if (mapsConfigLoading) {
    return (
      <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading route map...
      </div>
    );
  }

  if (mapsConfigError || !mapsConfig?.key) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Unable to load map configuration. Please verify `/api/maps-config` response.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Route</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Set From and To — distance and route update automatically after you stop typing.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="space-y-1.5">
          <Label htmlFor="route-from">From</Label>
          <Input
            id="route-from"
            ref={fromInputRef}
            placeholder="Search starting location"
            value={fromLocation}
            onChange={(e) => setFromLocation(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="self-end gap-2"
          onClick={useCurrentLocationAsFrom}
        >
          <LocateFixed className="h-4 w-4" />
          Get Current Location
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="route-to">To</Label>
        <Input
          id="route-to"
          ref={toInputRef}
          placeholder="Search destination"
          value={toLocation}
          onChange={(e) => setToLocation(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-border overflow-hidden relative">
        <div ref={setMapHost} className="h-[320px] w-full bg-muted/30" />
        {isCalculating && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-lg border border-border bg-background/90 px-3 py-2 text-sm text-muted-foreground shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Calculating route…
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Route className="h-4 w-4" /> Route distance:
          </span>
          <span className="font-semibold text-foreground">{distanceText}</span>
        </div>
      </div>
    </div>
  );
}
