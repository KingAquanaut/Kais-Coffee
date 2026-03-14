<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Upload Disk
    |--------------------------------------------------------------------------
    |
    | The disk used by UploadService for all admin file uploads (menu item
    | images, hero images, team photos).
    |
    |   Development:  UPLOAD_DISK=public  (local filesystem, served via /storage)
    |   Production:   UPLOAD_DISK=s3      (or any other cloud driver below)
    |
    | When switching to cloud storage, also set the AWS_* vars in .env and
    | run `php artisan storage:unlink` to remove the now-unused local symlink.
    |
    */

    'upload_disk' => env('UPLOAD_DISK', 'public'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver'                  => 's3',
            'key'                     => env('AWS_ACCESS_KEY_ID'),
            'secret'                  => env('AWS_SECRET_ACCESS_KEY'),
            'region'                  => env('AWS_DEFAULT_REGION'),
            'bucket'                  => env('AWS_BUCKET'),
            // AWS_URL: override the URL used for public file links.
            // Leave blank to use the native S3 URL (https://{bucket}.s3.{region}.amazonaws.com).
            // Set to your CloudFront or CDN domain for production (e.g. https://cdn.kaiscoffee.com).
            'url'                     => env('AWS_URL'),
            // AWS_ENDPOINT: only needed for S3-compatible services (MinIO, Cloudflare R2, etc.)
            'endpoint'                => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            // All uploaded files are publicly readable (menu images, hero photos).
            'visibility'              => 'public',
            'throw'                   => false,
            'report'                  => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
