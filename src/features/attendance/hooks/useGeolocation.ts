import { useState, useCallback } from "react";
 
interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
 locationName: string | null;
  error: string | null;
  loading: boolean;
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
 try {
   const response = await fetch(
     `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=21&addressdetails=1`,
     {
       headers: {
         'Accept-Language': 'en',
       },
     }
   );
   const data = await response.json();
   
   if (data.address) {
     const parts = [];
     // Prioritize building/venue names for precision
     const buildingName = data.address.building || data.address.amenity || data.address.shop || 
       data.address.office || data.address.tourism || data.address.leisure || data.address.house_name;
     if (buildingName) parts.push(buildingName);
     if (data.address.road) parts.push(data.address.road);
     if (data.address.suburb) parts.push(data.address.suburb);
     if (!buildingName) {
       if (data.address.city || data.address.town || data.address.village) {
         parts.push(data.address.city || data.address.town || data.address.village);
       }
     }
     return parts.length > 0 ? parts.join(', ') : data.display_name?.split(',').slice(0, 3).join(',') || 'Unknown location';
   }
   return data.display_name?.split(',').slice(0, 3).join(',') || 'Unknown location';
 } catch {
   return 'Location detected';
 }
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
       
       // Get location name via reverse geocoding
       const locationName = await reverseGeocode(lat, lon);
       
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