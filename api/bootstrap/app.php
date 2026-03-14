<?php

use App\Http\Middleware\AdminMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // ── Trusted proxies ───────────────────────────────────────────────────
        // Required when the API runs behind a reverse proxy, load balancer, or CDN
        // (nginx, AWS ALB, Cloudflare, Laravel Forge, etc.) so that
        // $request->ip(), isSecure(), and getHost() return the real client values.
        //
        // TRUSTED_PROXIES env var:
        //   ''   → no proxy trust (default; safe for direct-to-internet servers)
        //   '*'  → trust all proxies (use only when your firewall blocks external IPs)
        //   '10.0.0.0/8,172.16.0.0/12' → trust specific CIDR ranges
        $proxies = env('TRUSTED_PROXIES', '');
        if ($proxies !== '') {
            $middleware->trustProxies(
                at: $proxies,
                headers: Request::HEADER_X_FORWARDED_FOR
                    | Request::HEADER_X_FORWARDED_HOST
                    | Request::HEADER_X_FORWARDED_PORT
                    | Request::HEADER_X_FORWARDED_PROTO
                    | Request::HEADER_X_FORWARDED_AWS_ELB,
            );
        }

        $middleware->alias([
            'admin' => AdminMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
