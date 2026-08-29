<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductoController;

//Api Resource escribe automaticamente el get,Post,Patch,Put,Delete
Route::apiResource('productos', ProductoController::class);
