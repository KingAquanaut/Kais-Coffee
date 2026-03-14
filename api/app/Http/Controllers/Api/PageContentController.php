<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PageContent;
use Illuminate\Http\JsonResponse;

class PageContentController extends Controller
{
    /**
     * Return all content fields for a page as a flat key→value object.
     * Public — no authentication required.
     */
    public function show(string $page): JsonResponse
    {
        return response()->json(PageContent::forPage($page));
    }
}
