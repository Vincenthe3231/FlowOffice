<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
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
        $key = 'geocode:' . md5(strtolower(trim($address)));

        if (Cache::has($key)) {
            $cached = Cache::get($key);

            return $cached === '__null__' ? null : $cached;
        }

        $response = Http::withHeaders(['User-Agent' => self::USER_AGENT])
            ->get(self::SEARCH_URL, [
                'q' => $address,
                'format' => 'json',
                'limit' => 1,
            ]);

        if (! $response->successful()) {
            Cache::put($key, '__null__', 86400);

            return null;
        }

        $results = $response->json();
        $first = $results[0] ?? null;

        if (! $first || ! isset($first['lat'], $first['lon'])) {
            Cache::put($key, '__null__', 86400);

            return null;
        }

        $coords = [
            'lat' => (float) $first['lat'],
            'lng' => (float) $first['lon'],
        ];

        Cache::put($key, $coords, 86400);

        return $coords;
    }

    /**
     * Reverse geocode lat/lng to a human-readable location name using OpenStreetMap Nominatim.
     * Builds a short name from address parts (amenity → road → suburb → city → town → village).
     * Fallback: display_name first 3 comma-separated parts.
     * Returns null if not found or API/HTTP error.
     */
    public function reverseGeocode(float $lat, float $lng): ?string
    {
        $cacheKey = 'rev_geocode:' . round($lat, 4) . '_' . round($lng, 4);

        if (Cache::has($cacheKey)) {
            $cached = Cache::get($cacheKey);

            return $cached === '__null__' ? null : $cached;
        }

        $response = Http::withHeaders(['User-Agent' => self::USER_AGENT])
            ->get(self::REVERSE_URL, [
                'lat' => $lat,
                'lon' => $lng,
                'format' => 'json',
            ]);

        if (! $response->successful()) {
            Cache::put($cacheKey, '__null__', 86400);

            return null;
        }

        $body = $response->json();
        if (! $body || isset($body['error'])) {
            Cache::put($cacheKey, '__null__', 86400);

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
            $result = implode(', ', array_slice($parts, 0, 4));
            Cache::put($cacheKey, $result, 86400);

            return $result;
        }

        // Fallback: first 3 parts of display_name
        $displayName = $body['display_name'] ?? '';
        $fallbackParts = array_map('trim', explode(',', $displayName));
        $fallback = implode(', ', array_slice($fallbackParts, 0, 3));

        $result = $fallback !== '' ? $fallback : null;
        Cache::put($cacheKey, $result ?? '__null__', 86400);

        return $result;
    }
}
