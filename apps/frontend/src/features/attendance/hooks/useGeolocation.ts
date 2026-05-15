import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { reverseGeocode } from "@/shared/lib/api-client/geocode";

const REVERSE_GEOCODE_STALE_MS = 5 * 60 * 1000; // 5 minutes

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

function roundCoord(value: number, decimals = 4): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
  });

  const { latitude, longitude } = state;

  const roundedCoords = useMemo(() => {
    if (latitude == null || longitude == null) return null;
    return { lat: roundCoord(latitude), lng: roundCoord(longitude) };
  }, [latitude, longitude]);

  const {
    data: locationName,
    isLoading: locationNameLoading,
  } = useQuery({
    queryKey: ["reverseGeocode", roundedCoords?.lat, roundedCoords?.lng],
    queryFn: () => {
      if (process.env.NODE_ENV === "development") {
        console.debug("[reverseGeocode] API call (cache miss)", {
          lat: roundedCoords?.lat,
          lng: roundedCoords?.lng,
        });
      }
      return reverseGeocode(latitude!, longitude!);
    },
    enabled: latitude != null && longitude != null,
    staleTime: REVERSE_GEOCODE_STALE_MS,
    gcTime: REVERSE_GEOCODE_STALE_MS * 2,
  });

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
        loading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setState({
          latitude: lat,
          longitude: lon,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
        });
      },
      (error) => {
        let errorMessage = "Failed to get location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        setState({
          latitude: null,
          longitude: null,
          accuracy: null,
          error: errorMessage,
          loading: false,
        });
      },
      GEO_OPTIONS
    );
  }, []);

  /** Fresh GPS fix; await in one tap (e.g. clock-out). Updates state on success like getLocation. */
  const getLocationAsync = useCallback((): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = "Geolocation is not supported by your browser";
        setState((prev) => ({ ...prev, error: msg, loading: false }));
        reject(new Error(msg));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setState({
            latitude: lat,
            longitude: lon,
            accuracy: position.coords.accuracy,
            error: null,
            loading: false,
          });
          resolve({ latitude: lat, longitude: lon });
        },
        (error) => {
          let errorMessage = "Failed to get location";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please enable location access.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }
          setState({
            latitude: null,
            longitude: null,
            accuracy: null,
            error: errorMessage,
            loading: false,
          });
          reject(new Error(errorMessage));
        },
        GEO_OPTIONS
      );
    });
  }, []);

  const clearLocation = useCallback(() => {
    setState({
      latitude: null,
      longitude: null,
      accuracy: null,
      error: null,
      loading: false,
    });
  }, []);

  return {
    ...state,
    locationName: locationName ?? null,
    locationNameLoading: locationNameLoading && latitude != null && longitude != null,
    getLocation,
    getLocationAsync,
    clearLocation,
    hasLocation: state.latitude !== null && state.longitude !== null,
  };
}
