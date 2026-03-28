<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use Illuminate\Http\UploadedFile;

/**
 * Centralised image-upload helper backed by Cloudinary.
 *
 * Every admin upload (menu items, hero images, team photos) flows through
 * this service. The database stores only the secure URL returned by
 * Cloudinary — no binary data touches Postgres or Render disk.
 *
 * Usage:
 *   app(UploadService::class)->store($request->file('image'), 'menu-items');
 *   app(UploadService::class)->delete($existingUrl);
 */
class UploadService
{
    private Cloudinary $cloudinary;
    private string $rootFolder;

    public function __construct()
    {
        $this->cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => config('cloudinary.cloud_name'),
                'api_key'    => config('cloudinary.api_key'),
                'api_secret' => config('cloudinary.api_secret'),
            ],
            'url' => ['secure' => true],
        ]);

        $this->rootFolder = config('cloudinary.folder', 'kais-coffee');
    }

    /**
     * Upload a file to Cloudinary and return its secure URL.
     *
     * @param  UploadedFile  $file       The uploaded file from the request.
     * @param  string        $directory  Subfolder inside the root folder
     *                                   (e.g. "menu-items", "pages/home").
     * @return string  The Cloudinary secure URL for the uploaded image.
     */
    public function store(UploadedFile $file, string $directory): string
    {
        $folder = trim("{$this->rootFolder}/{$directory}", '/');

        $result = $this->cloudinary->uploadApi()->upload(
            $file->getRealPath(),
            [
                'folder'         => $folder,
                'resource_type'  => 'image',
                'overwrite'      => false,
                'unique_filename' => true,
            ]
        );

        return $result['secure_url'];
    }

    /**
     * Delete a Cloudinary asset by its secure URL.
     *
     * Extracts the public_id from the URL and calls the destroy API.
     * Silently does nothing if the URL is not a valid Cloudinary URL.
     */
    public function delete(string $url): void
    {
        $publicId = $this->extractPublicId($url);

        if ($publicId) {
            try {
                $this->cloudinary->uploadApi()->destroy($publicId);
            } catch (\Throwable) {
                // Silently ignore — the asset may already be deleted or
                // the URL may be from the old local/S3 storage.
            }
        }
    }

    /**
     * Extract the Cloudinary public_id from a secure URL.
     *
     * Cloudinary URLs follow this pattern:
     *   https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}.{ext}
     *
     * The public_id is everything after "/upload/v{digits}/" without the extension.
     */
    private function extractPublicId(string $url): ?string
    {
        // Match: /upload/v{digits}/{public_id}.{ext}
        if (preg_match('#/upload/v\d+/(.+)\.\w+$#', $url, $matches)) {
            return $matches[1];
        }

        return null;
    }
}
