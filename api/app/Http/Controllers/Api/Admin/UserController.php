<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with('rewardAccount')->where('is_admin', false);

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'ilike', "%{$s}%")
                  ->orWhere('email', 'ilike', "%{$s}%");
            });
        }

        return response()->json($query->latest()->paginate(25));
    }

    public function show(User $user): JsonResponse
    {
        return response()->json(
            $user->load([
                'rewardAccount',
                'purchases' => fn ($q) => $q->with('items')->latest()->limit(10),
            ])
        );
    }
}
