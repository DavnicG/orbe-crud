<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TwoFactorCodeNotification extends Notification
{
    use Queueable;

    /**
     * Recibe el código en texto plano únicamente para construir el correo.
     *
     * No se guarda en la base de datos: allí se almacena exclusivamente su hash.
     */
    public function __construct(private readonly string $code){

    }
    /**
     * Define el canal de entrega.
     *
     * Laravel utilizará el correo almacenado en $user->email.
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Construye el correo del segundo factor.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Código de verificación de acceso')
            ->greeting("Hola, {$notifiable->name}.")
            ->line('Recibimos una solicitud para iniciar sesión en Orbe CRUD.')
            ->line("Tu código de verificación es: {$this->code}")
            ->line('Este código vence en 10 minutos y solo se puede usar una vez.')
            ->line('Si no intentaste iniciar sesión, contacta con el administrador.');
    }

}
