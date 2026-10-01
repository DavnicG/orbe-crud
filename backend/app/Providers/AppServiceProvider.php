<?php

namespace App\Providers;

// Importamos el modelo User que será protegido por la Policy.
use App\Models\User;
// Importamos la Policy que contiene las reglas de usuarios.
use App\Policies\UsuarioPolicy;
// Importamos Gate para registrar manualmente la relación modelo-Policy.
use Illuminate\Support\Facades\Gate;
// Importamos la clase base del Service Provider.
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Asociamos explícitamente el modelo User con UsuarioPolicy.
        Gate::policy(User::class, UsuarioPolicy::class);
    }
}
