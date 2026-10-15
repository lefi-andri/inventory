<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'locale' => $request->session()->get('locale', 'id'),
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));

        $customerRole = Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
        $user->assignRole($customerRole);

        Auth::login($user);

        return redirect(route('storefront', absolute: false))->with(
            'success',
            'Akun berhasil dibuat. Lengkapi data diri dan alamat pengiriman Anda sebelum berbelanja.',
        );
    }
}
