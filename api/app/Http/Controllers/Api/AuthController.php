<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RewardAccount;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'phone'    => ['nullable', 'string', 'max:30'],
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'phone'    => $data['phone'] ?? null,
        ]);

        RewardAccount::create(['user_id' => $user->id]);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user'  => $user->load('rewardAccount'),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user->rewardAccount ?? RewardAccount::create(['user_id' => $user->id]);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user'  => $user->load('rewardAccount'),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user()->load('rewardAccount'));
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'  => ['sometimes', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        $request->user()->update($data);

        return response()->json($request->user()->fresh()->load('rewardAccount'));
    }
}
