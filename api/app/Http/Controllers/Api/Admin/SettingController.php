<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Setting::orderBy('key')->get());
    }

    public function update(Request $request, string $key): JsonResponse
    {
        $data = $request->validate(['value' => ['required']]);

        Setting::updateOrCreate(['key' => $key], ['value' => $data['value']]);

        return response()->json(['key' => $key, 'value' => $data['value']]);
    }
}
