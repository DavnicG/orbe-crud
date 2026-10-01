<?php

namespace App\Providers;

use App\Models\Producto;
use App\Models\User;
use App\Policies\ProductoPolicy;
use App\Policies\UsuarioPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        //Mapeamos el producto con su policy correspondiente
        Producto::class => ProductoPolicy::class,
        // Policy de usuarios.
        User::class => UsuarioPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        //
    }
}
