import { useEffect, useState } from "react";
import {obtenerProductos, crearProducto, eliminarProducto, actualizarProducto} from '../services/ProductoService';
import { mostrarCargando, cerrarAlerta, mostrarExito, mostrarError, confirmarEliminacion } from "../utils/alerts";
import ProductoTable from '../components/ProductoTable';
import ProductoFormModal from "../components/ProductoFormModal";
import {useAuth} from "../context/AuthContext";
import { cerrarSesion } from "../services/AuthService";


function ProductosPage(){
    
    //Estado donde se guardan los productos traidos de Laravel
    const [productos, setProductos] = useState([]);

    //Estado para mostrar mensaje mientras se consulta la API
    const [cargando, setCargando] = useState(true);

    //Estado para capturar errores
    const[error, setError] = useState('');

    //Estado del producto selecionado si es Null estamos en modo crear , si no estamos en modo eeditar
    const [productoSelecionado, setProductoSelecionado] = useState(null);

    //Estado para mostrar u ocultar el modal
    const[mostarModal, setMostrarModal] = useState(false);
    
    // Guarda los productos seleccionados desde la tabla
    const[productosSeleccionados, setProductosSeleccionados] = useState([]);

    // Obtenemos el usuario autenticado y la función para cerrar sesión localmente.
    const { usuario, cerrarSesionLocal } = useAuth();

    const puedeCrearProducto =
        usuario?.rol === 'admin' || usuario?.rol === 'editor';

    const puedeGestionarProductos =
        usuario?.rol === 'admin' || usuario?.rol === 'editor';
    
    //Esta funcion consulta los productos del backend
    useEffect(()=>{

        const cargarProductos = async () =>{

            try{
                //Mostramos  el loader  de SweetAlert2 
                mostrarCargando('Consultando productos...');
            
                //Llamamos a Service
                const respuesta = await obtenerProductos();

                //Axios guarda el JSON de Laravel en data
                setProductos(respuesta.data.data);
            }catch(error){
                console.error('Error al consultar productos:', error);
                setError('No se pudieron cargar los productos');
                mostrarError('No se pudieron cargar los productos');    //Alerta visual del error
            }finally{
                setCargando(false);
                cerrarAlerta();     // Cerramos el loader siempre, haya error o no
            }
        };
        
        cargarProductos();
    },[]);

    //Abre el modal en modo Crear
    const handleAbrirModalCrear = () => {
        setProductoSelecionado(null);
        setMostrarModal(true);
    };
    //Abre el modal en modo Editar
    const handleAbrirModalEditar = (producto) => {
        setProductoSelecionado(producto);
        setMostrarModal(true);
    };

    //Cierra el modal y limpia elproducto seleccionado
    const handleCerrarModal = () =>{
        setMostrarModal(false);
        setProductoSelecionado(null);
    };

    //Funcion unica que decide si crea o actualiza el producto
    const handleGuardarProducto = async (id, datosProducto) => {

        try {
            //Mensaje distinto si es creacion o edicion 
            mostrarCargando(id ? 'Actualizando Producto...' : 'Guardando Producto...');
            if(id){
                //Modo edicion
                const respuesta = await actualizarProducto(id, datosProducto);

                setProductos((prevProductos) =>
                    prevProductos.map((producto)=>
                        producto.id === id ? respuesta.data.data : producto
                    )
                );
            } else{
                //Modo Creacion
                const respuesta = await crearProducto(datosProducto);

                //Se agrega eñ nevo producto sin recargar la pag
                setProductos ((prevProductos)=> [respuesta.data.data, ...prevProductos]);
            }

            cerrarAlerta();     //Cerramos el loader
            handleCerrarModal();

            //Mensaje de exito
            mostrarExito(id ? 'Producto actualizado correctamente' : 'Producto creado correctamente')
        
        
        } catch (error) {
            console.error('Error al guardar el producto', error);
            cerrarAlerta();
            mostrarError(id ? 'No se pudo actualizar el producto.' : 'No se pudo crear el producto')
        }
    }

    //Esta funcion se llamara cuando el usuario pulse Eliminar
    const handleEliminarProducto = async (producto) => {

        //pedimos confirmacion
        const confirmado = await confirmarEliminacion(producto.nombre);

        //Si el usuario cancela, salimos de la funcion
        if (!confirmado) return;

        //Si el usuario confirma:
        try{

            mostrarCargando('Eliminando producto...');
            //Enviamos la peticion del DELETE
            await eliminarProducto(producto.id);

            //Si el backend elimino el producto, lo quitamos 
            setProductos((prevProductos) => prevProductos.filter((p) => p.id !== producto.id));
            setProductosSeleccionados((prev) => prev.filter((p) => p.id !== producto.id));

            cerrarAlerta();
            mostrarExito('Producto eliminado');
        }catch (error){
            console.error('Error al eliminar producto', error);
            setError ('No se pudo eliminar el producto');
            mostrarError('No se pudo eliminar el producto');
        }
    };

    const handleEliminarSeleccionados = async () =>{
        if(productosSeleccionados.length === 0) return;

        const confirmado = await confirmarEliminacion(
            `${productosSeleccionados.length} productos seleccionados`
        );

        if(!confirmado) return;

        try {
            mostrarCargando('Eliminando Productos Seleccionados...');
            await Promise.all(
                productosSeleccionados.map((producto) => eliminarProducto(producto.id))
            );

            const idsEliminados = productosSeleccionados.map((p) => p.id);
            // Quitamos del listado todos los productos eliminados
            setProductos((prevProductos) =>
                prevProductos.filter((p)=> !idsEliminados.includes(p.id))
            );
            // Limpiamos la selección
            setProductosSeleccionados([]);
            cerrarAlerta();
            mostrarExito("Productos eliminados correctamente");
        }catch (error){
            console.error("Error al eliminar productos seleccionados", error);
            cerrarAlerta();
            mostrarError("No se pudieron eliminar los productos seleccionados");
        } 
    };

    // Se ejecuta cuando el usuario hace clic en "Cerrar sesión"
    const handleCerrarSesion = async () => {
        try{
            // Le avisamos a Laravel que revoque el token actual.
            await cerrarSesion();
        }catch(error){
        console.error('Error al cerrar sesión en el servidor:', error);
        }finally{
        // Limpiamos localStorage y el estado del contexto.
        // Esto hace que RutaProtegida redirija automáticamente a /login.
        cerrarSesionLocal();
        }
    };  

    return (
        // bg-light da el fondo gris claro a toda la página, min-vh-100 lo extiende hasta el final
        <main className="bg-light min-vh-100 py-4">

            {/* Contenedor centrado con ancho máximo */}
            <div className="container-fluid px-3 px-md-4 px-lg-4">

            {/* ── ENCABEZADO: título a la izquierda, botón a la derecha ── */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3 mb-4">
                <div>
                {/* Título principal de la página */}
                <h1 className="h3 fw-bold mb-1">Productos Tecnológicos</h1>
                {/* Subtítulo descriptivo en gris */}
                <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                    Gestion de inventario y catálogo.
                </p>
                </div>

                {/* usuario + logout + Botón para abrir el modal de creación*/}
                <div className="d-flex align-items-center gap-3">

                    {/* Mostramos el nombre del usuario autenticado, si existe */}
                    {usuario && (
                        <span className="text-muted small d-none d-md-inline">
                            <i className="bi bi-person-circle me-1"></i>
                            {usuario.name} <span className="text-capitalize">({usuario.rol})</span>
                        </span>
                    )}

                    {puedeCrearProducto && (
                        <button className="btn btn-primary" onClick={handleAbrirModalCrear}>
                            <i className="bi bi-plus-lg"></i> Agregar producto
                        </button>
                    )}

                    {/* Botón para cerrar sesión */}
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={handleCerrarSesion}
                        title="Cerrar sesión"
                    >
                        <i className="bi bi-box-arrow-right"></i>
                    </button>

                </div>

            </div>

            {/* ── TARJETA BLANCA que envuelve toda la tabla ── */}
            {/* shadow-sm = sombra sutil, rounded = bordes redondeados */}
            <div className="card shadow-sm rounded-3">
                <div className="card-body p-3">

                {/* Estado: cargando */}
                {cargando && <p className="text-muted">Cargando Productos...</p>}

                {/* Estado: error */}
                {error && <div className="alert alert-danger">{error}</div>}

                {/* Estado: sin productos */}
                {!cargando && !error && productos.length === 0 && (
                    <div className="alert alert-warning">No hay productos registrados</div>
                )}
                
                {/* Barra de acciones masivas */}
                {!cargando && !error && productos.length > 0 && (
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
                    <span className="text-muted small">
                    {productosSeleccionados.length} seleccionados
                    </span>
                    {puedeGestionarProductos && (
                        <button
                        type="button"
                        className="btn btn-outline-danger d-inline-flex align-items-center gap-2"
                        disabled={productosSeleccionados.length === 0}
                        onClick={handleEliminarSeleccionados}
                        >
                        <i className="bi bi-trash"></i>
                        Eliminar seleccionados
                        </button>
                    )}
                </div>
                )}

                {/* Tabla de productos — solo se muestra cuando hay datos */}
                {!cargando && !error && productos.length > 0 && (
                    <ProductoTable
                    productos={productos}
                    usuarioActual={usuario}
                    onEditarProducto={handleAbrirModalEditar}
                    onEliminarProducto={handleEliminarProducto}
                    onSeleccionChange = {setProductosSeleccionados}
                    />
                )}

                </div>
            </div>

            </div>

            {/* Modal de creación/edición (siempre montado en el DOM) */}
            <ProductoFormModal
            visible={mostarModal}
            producto={productoSelecionado}
            onCerrar={handleCerrarModal}
            onGuardar={handleGuardarProducto}
            />

        </main>
    );
}

export default ProductosPage;