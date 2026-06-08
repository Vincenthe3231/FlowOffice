<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class GeocodeService
{
    private const SEARCH_URL = 'https://nominatim.openstreetmap.org/search';

    private const REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

    // Nominatim usage policy requires a descriptive User-Agent
    private const USER_AGENT = 'FlowOffice/1.0';

    /**
     * Get lat/lng for an address using OpenStreetMap Nominatim.
     * Returns ['lat' => float, 'lng' => float] or null if not found / API error.
     */
    public function geocode(string $address): ?array
    {
        $response = Http::withHeaders(['User-Agent' => self::USER_AGENT])
            ->get(self::SEARCH_URL, [
                'q' => $address,
                'format' => 'json',
                'limit' => 1,
            ]);

        if (! $response->successful()) {
            return null;
        }

        $results = $response->json();
        $first = $results[0] ?? null;

        if (! $first || ! isset($first['lat'], $first['lon'])) {
            return null;
        }

        return [
            'lat' => (float) $first['lat'],
            'lng' => (float) $first['lon'],
        ];
    }

    /**
     * Reverse geocode lat/lng to a human-readable location name using OpenStreetMap Nominatim.
     * Builds a short name from address parts (amenity → road → suburb → city → town → village).
     * Fallback: display_name first 3 comma-separated parts.
     * Returns null if not found or API/HTTP error.
     */
    public function reverseGeocode(float $lat, float $lng): ?string
    {
        $response = Http::withHeaders(['User-Agent' => self::USER_AGENT])
            ->get(self::REVERSE_URL, [
                'lat' => $lat,
                'lon' => $lng,
                'format' => 'json',
            ]);

        if (! $response->successful()) {
            return null;
        }

        $body = $response->json();
        if (! $body || isset($body['error'])) {
            return null;
        }

        $addr = $body['address'] ?? [];

        // Priority: amenity/tourism/building → road → suburb → city/town/village
        $parts = [];
        foreach (['amenity', 'tourism', 'building', 'road', 'suburb', 'city', 'town', 'village'] as $key) {
            $value = $addr[$key] ?? null;
            if ($value !== null && $value !== '' && ! in_array($value, $parts, true)) {
                $parts[] = $value;
            }
        }

        if ($parts !== []) {
            return implode(', ', array_slice($parts, 0, 4));
        }

        // Fallback: first 3 parts of display_name
        $displayName = $body['display_name'] ?? '';
        $fallbackParts = array_map('trim', explode(',', $displayName));
        $fallback = implode(', ', array_slice($fallbackParts, 0, 3));

        return $fallback !== '' ? $fallback : null;
    }
}
