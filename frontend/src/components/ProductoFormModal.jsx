import {useEffect, useState} from 'react';

//Este componente sirve para crear y para editar productos
//si el producto es null -> Modo crear
//Si el producto tiene datos -> Modo editar

function ProductoFormModal ({visible, producto, onCerrar, onGuardar}){

    //Se define el modo actual comparando si hay un producto o no.
    const esEdicion = Boolean(producto);

    //Estado local del formulario 
    const estadoInicial = {
        nombre: '',
        marca: '',
        categoria:'',
        precio:'',
        stock:'',
        descripcion:'',
        activo: true,
    };

    // Estado local del formulario.
    const [formData, setFormData] = useState(estadoInicial);
    
    //Estado para mostrar si se esta enviando el formulario
    const [guardando, setGuardando] = useState(false);

    //Estado para mostrar errores
    const [error, setError] = useState('');
    
    //Cada vez que cambia "Produto" o "visible", iniciamos  el formulario.
    //Si hay producto cargamod sus datos
    //Si no hay producto, dejamos el form vacio
    useEffect(()=>{
        if(producto){
            setFormData({
                nombre: producto.nombre ?? '',
                marca: producto.marca ?? '',
                categoria: producto.categoria ?? '',
                precio: producto.precio ?? '',
                stock: producto.stock ?? '',
                descripcion: producto.descripcion ?? '',
                activo: producto.activo ?? true,
            });
        }else{
            setFormData({
                nombre:'',
                marca:'',
                categoria:'',
                precio:'',
                stock:'',
                descripcion:'',
                activo: true,
            });            
        }

        //Se limpian errores cada vez que se abre el Modal
        setError('');
    }, [producto, visible]);

    //Si el modal no debe mostrarse, no se renderiza
    if(!visible) return null;

    //Maneja cambios en inputs y checkbox
    const handleChange = (e) =>{
        const {name, value, type, checked} = e.target;

        let nuevoValor = type === 'checkbox' ? checked : value; 

        if (name === 'precio' || name === 'stock'){
            nuevoValor = nuevoValor.replace(/[eE+-]/g, '');
        }

        setFormData({
            ...formData,
            [name]: nuevoValor,
        });
    };

    //Maneja el envio del formulario
    //Llama onGuardar con el id (si es edicion) o sin id(crear)
    const handleSubmit = async (e) =>{
        e.preventDefault();
        setGuardando(true);
        setError('');

        //Convertimos los campos numericos
        const datosFormateados = {
            ...formData,
            precio : Number(formData.precio),
            stock : Number(formData.stock),
        };

        try{
            //Si es edicion pasamos el ID
            //Si es creacion parasmos null en el id
            await onGuardar(esEdicion ? producto.id : null, datosFormateados);

            //Cerramos el modal cuando la operacion fue exitosa.
            onCerrar();
        }catch(error){
            console.error('Error al guardar el producto:', error);
            setError(
                esEdicion ? 'No se pudo actualizar el producto.' : 'No se pudo crear el producto'
            );
        }finally{
            setGuardando(false);
        }
    };

    const bloquearCaracteresNumero = (e) => {
        if(['e', 'E', '+', '-'].includes(e.key)){
            e.preventDefault();
        }
    };

    return(
        <>
            {/*Fondo oscuro detras del Modal*/}
            <div className="modal-backdrop fade show"></div>

            {/*Estructura principal del modal*/}
            <div
                className='modal fade show d-block'
                tabIndex="-1"
                role='dialog'
                aria-modal="true"
            >
                <div className='modal-dialog modal-lg'>
                    <div className='modal-content'>
                        {/*Encabezado: el titulo cambia segun el modo*/}
                        <div className='modal-header'>
                            <h5 className='modal-title'>
                                {esEdicion ? 'Editar producto' : 'Agregar producto'}
                            </h5>
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
                                            min="0"
                                            step="0.1"
                                            className='form-control'
                                            value={formData.precio}
                                            onChange={handleChange}
                                            onKeyDown={bloquearCaracteresNumero}

                                        />
                                    </div>

                                    {/*Campo Stock*/}
                                    <div className="col-md-3 mb-3">
                                        <label className='form-label'>Stock:</label>
                                        <input type="number"
                                            name="stock"
                                            min="0"
                                            step="1"
                                            className='form-control'
                                            value={formData.stock}
                                            onChange={handleChange}
                                            onKeyDown={bloquearCaracteresNumero}
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
                                {error && <div className='alert alert-danger'>{error}</div>}

                                {/*Pie del modal: el testo del boton cambia segun el modo*/}
                                <div className="modal-footer px-0 pb-0">
                                    {/*Boton para Cancelar*/}
                                    <button type='button' className="btn btn-secondary" onClick={onCerrar}>
                                        Cancelar
                                    </button>

                                    {/*Boton para guardar*/}
                                    <button type="submit" className="btn btn-primary" disabled={guardando}>
                                        {guardando ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Guardar producto'}
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

export default ProductoFormModal;