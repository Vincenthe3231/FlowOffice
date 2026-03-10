import { useState, useCallback } from "react";
import { reverseGeocode } from "@/shared/lib/api-client/geocode";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  locationName: string | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    locationName: null,
    error: null,
    loading: false,
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
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        const locationName =
          (await reverseGeocode(lat, lon)) ?? "Location detected";

        setState({
          latitude: lat,
          longitude: lon,
          accuracy: position.coords.accuracy,
          locationName,
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
          locationName: null,
          error: errorMessage,
          loading: false,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const clearLocation = useCallback(() => {
    setState({
      latitude: null,
      longitude: null,
      accuracy: null,
      locationName: null,
      error: null,
      loading: false,
    });
  }, []);

  return {
    ...state,
    getLocation,
    clearLocation,
    hasLocation: state.latitude !== null && state.longitude !== null,
  };
}