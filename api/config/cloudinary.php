<?php

/*
|--------------------------------------------------------------------------
| Cloudinary Configuration
|--------------------------------------------------------------------------
|
| Used by App\Services\UploadService for all admin image uploads.
|
| Set CLOUDINARY_URL in .env using the format from the Cloudinary dashboard:
|   cloudinary://API_KEY:API_SECRET@CLOUD_NAME
|
*/

$parsed = [];
$url = env('CLOUDINARY_URL');
if ($url) {
    $parts = parse_url($url);
    $parsed = [
        'cloud_name' => $parts['host'] ?? null,
        'api_key'    => $parts['user'] ?? null,
        'api_secret' => $parts['pass'] ?? null,
    ];
}

return [
    'cloud_name'  => $parsed['cloud_name'] ?? null,
    'api_key'     => $parsed['api_key']    ?? null,
    'api_secret'  => $parsed['api_secret'] ?? null,

    // Top-level folder in the Cloudinary media library.
    // Uploads go to: {folder}/{subfolder}/{filename}
    'folder'      => env('CLOUDINARY_FOLDER', 'kais-coffee'),
];
