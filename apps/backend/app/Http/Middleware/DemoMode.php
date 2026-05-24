<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DemoMode
{
    private const WHITELISTED_PATHS = [
        'api/auth/login',
        'api/auth/logout',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        if (!config('app.demo_mode')) {
            return $next($request);
        }

        if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            foreach (self::WHITELISTED_PATHS as $path) {
                if ($request->is($path)) {
                    return $next($request);
                }
            }

            return response()->json([
                'error' => 'DEMO_MODE',
                'message' => 'This action is disabled in demo mode.',
                'status' => 403,
            ], 403);
        }

        return $next($request);
    }
}
