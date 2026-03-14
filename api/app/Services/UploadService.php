<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Centralised file-upload helper.
 *
 * Uses the disk named by config('filesystems.upload_disk'), which is read from
 * the UPLOAD_DISK env var.  Set it to "public" in development and to "s3" (or
 * any other cloud driver) in production.  Everything else — URL generation,
 * deletion — adjusts automatically.
 *
 * Usage:
 *   app(UploadService::class)->store($request->file('image'), 'menu-items');
 *   app(UploadService::class)->delete($existingUrl);
 */
class UploadService
{
    private string $disk;

    public function __construct()
    {
        $this->disk = config('filesystems.upload_disk', 'public');
    }

    /**
     * Persist an uploaded file under $directory and return its full public URL.
     */
    public function store(UploadedFile $file, string $directory): string
    {
        $path = $file->store($directory, $this->disk);

        return $this->urlFor($path);
    }

    /**
     * Delete a file by the public URL that was previously returned by store().
     * Silently does nothing if the file does not exist.
     */
    public function delete(string $url): void
    {
        $path = $this->pathFrom($url);

        if ($path && Storage::disk($this->disk)->exists($path)) {
            Storage::disk($this->disk)->delete($path);
        }
    }

    /**
     * Return the full public URL for a storage path on the configured disk.
     *
     * For the local "public" disk this is:  APP_URL . "/storage/" . $path
     * For S3 this is:                       AWS_URL . "/" . $path   (or the native S3 URL)
     */
    public function urlFor(string $path): string
    {
        return Storage::disk($this->disk)->url($path);
    }

    // ── private ──────────────────────────────────────────────────────────────

    /**
     * Reverse urlFor(): extract the storage-relative path from a public URL.
     *
     * Works by stripping the disk's own base URL prefix, so it automatically
     * handles port numbers in development and CDN/custom domains in production.
     */
    private function pathFrom(string $url): ?string
    {
        // Storage::disk()->url('') returns the base URL the disk uses (without trailing slash).
        $base = rtrim(Storage::disk($this->disk)->url(''), '/');

        if (str_starts_with($url, $base . '/')) {
            return substr($url, strlen($base) + 1);
        }

        return null;
    }
}
