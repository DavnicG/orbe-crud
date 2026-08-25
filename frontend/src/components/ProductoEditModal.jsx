import {useEffect, useState} from 'react';

//Este componente presenta el form de edicion
function ProductoEditModal({visible, producto, onCerrar, onActualizarProducto}){

    //Estado local del form en edicion
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

    //Cuando cambia el producto selecionado, llenamos el form
    useEffect(()=>{

        if(producto){

            setFormData({

                nombre: producto.nombre || '',
                marca: producto.marca || '',
                categoria: producto.categoria || '',
                precio: producto.precio || '',
                stock: producto.stock || '',
                descripcion: producto.descripcion || '',
                activo: producto.activo || '',
            });
        }

    }, [producto]);

    //Si visible es false, no se renderiza
    if(!visible) return null;

    //Maneja cambio de input y checkbox
    const handleChange = (e) => {

        //Extraemos propiedades del elemento que disparo el evento
        const {name, value, type, cheked} = e.target;

        //Se actualiza solo el campo que cambio
        setFormData({

            ...formData,
            [name]: type === 'checkbox' ? cheked : value,
        });
    };

    //Maneja el envio del form editado
    const handleSubmit = async (e) => {

        //Evita que el navegador recargue la pag
        e.preventDefault();
        //Se indica el comienzo del guardado
        setGuardando(true);
        //Se limpia cualquier error anterior
        setError('');

        try{
            //Llamamos la funcion del componente padre y se convierte precio y stock a #
            await onActualizarProducto(producto.id,{
                ...formData,
                precio: Number(formData.precio),
                stock: Number(formData.stock)
            });

            //Cerramos el modal si la edicion fue exitosa
            onCerrar();

        }catch(error){
            //Si la peticion falla mostramos el error en consola y pantalla
            console.error('Error al Actualizar producto: ', error);
            setError('No se pudo Actualizar el producto');
        }finally{
            //Se ejecuta siempre para indicar el fin del proceso de guardado
            setGuardando(false);
        }
    };

    return(
        <>
            {/*Capa oscura detras del modal*/}
            <div className='modal-backdrop fade show'></div>

            {/*Estructura principal del modal*/}
            <div
                className='modal fade show d-block'
                tabIndex={1}
                role='dialog'
                aria-modal="true"
            >

                <div className='modal-dialog modal-lg'>
                    <div className='modal-content'>

                        {/*Encabezado del modal*/}
                        <div className='modal-header'>
                            <h5 className='modal-title'>Editar Producto</h5>
                            <button
                                type='button'
                                className='btn-close'
                                onClick={onCerrar}
                            ></button>
                        </div>

                        {/*Cuerpo del modal*/}
                        <div className='modal-body'>
                            {/*form*/}
                            <form onSubmit={handleSubmit}>

                                <div className="row">
                                    {/*Campo Nombre*/}
                                    <div className="col-md-6 mb-3">
                                        <label className='form-label'>Nombre:</label>
                                        <input type="text"
                                            name="nombre"
                                            className='form-control'
                                            value={formData.nombre}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    {/*Campo Marca*/}
                                    <div className="col-md-6 mb-3">
                                        <label className='form-label'>Marca:</label>
                                        <input type="text"
                                            name="marca"
                                            className='form-control'
                                            value={formData.marca}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    {/*Campo Categoria*/}
                                    <div className="col-md-6 mb-3">
                                        <label className='form-label'>Categoria:</label>
                                        <input type="text"
                                            name="categoria"
                                            className='form-control'
                                            value={formData.categoria}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    {/*Campo Precio*/}
                                    <div className="col-md-3 mb-3">
                                        <label className='form-label'>Precio:</label>
                                        <input type="number"
                                            name="precio"
                                            className='form-control'
                                            value={formData.precio}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    {/*Campo Stock*/}
                                    <div className="col-md-3 mb-3">
                                        <label className='form-label'>Stock:</label>
                                        <input type="number"
                                            name="stock"
                                            className='form-control'
                                            value={formData.stock}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    {/*Campo Descripcion*/}
                                    <div className="col-md-12 mb-3">
                                        <label className='form-label'>Descripcion:</label>
                                        <textarea 
                                            name="descripcion"
                                            className='form-control'
                                            value={formData.descripcion}
                                            onChange={handleChange}
                                        />
                                    </div>

                                </div>
                                
                                {/*Mostramos un mensaje de error si lo hubo*/}
                                {error && <p style={{color: "red"}}>{error}</p>}

                                {/*Pie del modal*/}
                                <div className="modal-footer px-0 pb-0">
                                    {/*Boton para Cancelar*/}
                                    <button type='button' className="btn btn-secundary" onClick={onCerrar}>
                                        Cancelar
                                    </button>

                                    {/*Boton para guardar*/}
                                    <button type="submit" className="btn btn-primary" disabled={guardando}>
                                        {guardando ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}

export default ProductoEditModal;
