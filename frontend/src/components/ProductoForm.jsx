import { useState } from "react";

//Componente de formulario
function ProductoForm ({onCrearProducto, onProductoCreado}){

    //Estado local del formulario 
    const [formData, setFormData] = useState({
        nombre: '',
        marca: '',
        categoria:'',
        precio:'',
        stock:'',
        descripcion:'',
        activo: true,
    });

    //Estado para mostrar si se esta enviando el formulario
    const [guardando, setGuardando] = useState(false);

    //Estado para mostrar errores
    const [error, setError] = useState('');

    //Actualizacion del estado cuando el usuario escribe en un input
    const handleChange = (e) => {

        //Extraemos propiedades del elemento que disparo el evento
        const {name, value, type, cheked} = e.target;

        //Se actualiza solo el campo que cambio
        setFormData({

            ...formData,
            [name]: type === 'checkbox' ? cheked : value,
        });
    };

    //Se ejecuta cuando el usuario envia el form
    const handleSubmit = async (e) => {

        //Evita que el navegador recargue la pag
        e.preventDefault();
        //Se indica el comienzo del guardado
        setGuardando(true);
        //Se limpia cualquier error anterior
        setError('');

        try{
            //Llamamos la funcion del componente padre y se convierte precio y stock a #
            await onCrearProducto({
                ...formData,
                precio: Number(formData.precio),
                stock: Number(formData.stock)
            });

            //limpiamos el form al guardar
            setFormData({
                nombre:'',
                marca:'',
                categoria:'',
                precio:'',
                stock:'',
                descripcion:'',
                actvo: true,
            });

            if (onProductoCreado){
                onProductoCreado();
            }
        }catch(error){
            //Si la peticion falla mostramos el error en consola y pantalla
            console.error('Error al crear producto: ', error);
            setError('No se pudo crear el producto');
        }finally{
            //Se ejecuta siempre para indicar el fin del proceso de guardado
            setGuardando(false);
        }
    };

    return (

        //Card crea un contenedor visual con borde y padding
        <div className="card shadow-sm mb-4">

            <div className="card-body">

                <h2 className="card-title mb-4">Crear Producto</h2>

                {/*form*/}
                <form onSubmit={handleSubmit}>

                    <div className="row">
                        {/*Campo Nombre*/}
                        <div className="col-md-6 mb-3">
                            <label >Nombre:</label>
                            <input type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                            />
                        </div>

                        {/*Campo Marca*/}
                        <div className="col-md-6 mb-3">
                            <label>Marca:</label>
                            <input type="text"
                                name="marca"
                                value={formData.marca}
                                onChange={handleChange}
                            />
                        </div>

                        {/*Campo Categoria*/}
                        <div className="col-md-6 mb-3">
                            <label>Categoria:</label>
                            <input type="text"
                                name="categoria"
                                value={formData.categoria}
                                onChange={handleChange}
                            />
                        </div>

                        {/*Campo Precio*/}
                        <div className="col-md-3 mb-3">
                            <label>Precio:</label>
                            <input type="number"
                                name="precio"
                                value={formData.precio}
                                onChange={handleChange}
                            />
                        </div>

                        {/*Campo Stock*/}
                        <div className="col-md-3 mb-3">
                            <label>Stock:</label>
                            <input type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                            />
                        </div>

                        {/*Campo Descripcion*/}
                        <div className="col-md-12 mb-3">
                            <label>Descripcion:</label>
                            <textarea 
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                            />
                        </div>

                    </div>
                    
                    {/*Mostramos un mensaje de error si lo hubo*/}
                    {error && <p style={{color: "red"}}>{error}</p>}

                    <div className="d-flex gap-2">
                        {/*Boton para guardar*/}
                        <button type="submit" className="btn btn-primary" disabled={guardando}>
                            {guardando ? 'Guardando...' : 'Guardar Producto'}
                        </button>
                    </div>
                    

                </form>

            </div>

        </div>

    );
}

export default ProductoForm;