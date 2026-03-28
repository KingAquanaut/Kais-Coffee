<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cloudinary Credentials
    |--------------------------------------------------------------------------
    |
    | Used by App\Services\UploadService for all admin image uploads.
    | Set these in .env — never commit real values.
    |
    */

    'cloud_name'  => env('CLOUDINARY_CLOUD_NAME'),
    'api_key'     => env('CLOUDINARY_API_KEY'),
    'api_secret'  => env('CLOUDINARY_API_SECRET'),

    // Top-level folder in the Cloudinary media library.
    // Uploads go to: {folder}/{subfolder}/{filename}
    'folder'      => env('CLOUDINARY_FOLDER', 'kais-coffee'),

];
