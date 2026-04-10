<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PurchasesEnabledMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('app.features.purchases_enabled')) {
            return response()->json([
                'message' => 'Purchase features are not enabled.',
            ], 403);
        }

        return $next($request);
    }
}
