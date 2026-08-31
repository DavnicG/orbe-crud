//Importacion de la librebria Sweet para alertas
import Swal from "sweetalert2";

//Funcion reutilizable para mostrar loader
export const mostrarCargando = (titulo = 'Cargando...') =>{
    return Swal.fire({
        title: titulo,  //Titulo del modal
        text:'Por favor espera',    //Texto secundario
        allowOutsideClick: false,   //Evita cerrar al hacer click por fuera
        allowEscapeKey: false,  //Evita cerrar con ESC
        showConfirmButton: false,   //Oculta el boton "Aceptar"
        didOpen: () => {
            Swal.showLoading(); //Muestra el primer interno de SweetAlert2
        },
    });
};

//Cierra las alertas
export const cerrarAlerta = () =>{
    Swal.close();
};

//Funcion para mostrar acciones exitosas
export const mostrarExito = (mensaje) => {
    return Swal.fire({
        icon: 'success',
        title: 'Exito',
        text: mensaje,
        confirmButtonText: 'Aceptar',
    });
};

//Funcion para error
export const mostrarError = (mensaje) => {
    return Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
        confirmButtonText: 'Aceptar',
    });
};

//Funcion para confirmar borrado
export const confirmarEliminacion = async (nombreProducto) => {
    const resultado = await Swal.fire({
        icon:'warning',
        title:'¿Eliminar producto?',
        text:`Se eliminara: ${nombreProducto}`,
        showCancelButton: true,
        confirmButtonText: 'Si, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545', // Rojo, coherente con la acción destructiva
        cancelButtonColor: '#6c757d', // Gris neutro
    });

    return resultado.isConfirmed;
};