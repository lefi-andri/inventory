<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserManagementController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Users/Index', [
            'users' => User::with('roles')->latest()->get()->map(fn ($user) => [
                ...$user->only('id', 'name', 'email', 'created_at'),
                'role' => $user->roles->first()?->name,
            ]),
            'roles' => Role::orderBy('name')->pluck('name'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:160', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::exists('roles', 'name')],
        ]);
        $user = User::create([
            ...collect($data)->except('role')->all(),
            'password' => Hash::make($data['password']),
            'email_verified_at' => now(),
        ]);
        $user->assignRole($data['role']);

        return back()->with('success', 'Pengguna berhasil ditambahkan.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate(['role' => ['required', Rule::exists('roles', 'name')]]);
        if ($user->is($request->user()) && $data['role'] !== 'admin') {
            return back()->with('error', 'Anda tidak dapat menurunkan role akun sendiri.');
        }
        $user->syncRoles([$data['role']]);

        return back()->with('success', 'Role pengguna berhasil diperbarui.');
    }
}
