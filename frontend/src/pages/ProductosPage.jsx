import { useEffect, useState } from "react";
import {obtenerProductos, crearProducto, eliminarProducto, actualizarProducto} from '../services/ProductoService';
import { mostrarCargando, cerrarAlerta, mostrarExito, mostrarError, confirmarEliminacion } from "../utils/alerts";
import ProductoTable from '../components/ProductoTable';
import ProductoFormModal from "../components/ProductoFormModal";


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
    
    //Esta funcion consulta los productos del backend
    useEffect(()=>{

        const cargarProductos = async () =>{

            try{
                //Mostramos  el loader  de SweetAlert2 
                mostrarCargando('Consultando productos...');
            
                //Llamamos a Service
                const respuesta = await obtenerProductos();

                //Axios guarda el JSON de Laravel en data
                setProductos(respuesta.data);
            }catch(error){
                console.error('Error al consultar productos:', error);
                setError('No se pudieron cargar los productos');
                mostrarError('No se pudieron cargar los productos');    //Alerta visual dl error
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

            cerrarAlerta();
            mostrarExito('Producto eliminado');
        }catch (error){
            console.error('Error al eliminar producto', error);
            setError ('No se pudo eliminar el producto');
            mostrarError('No se pudo eliminar el producto');
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

                {/* Botón para abrir el modal de creación */}
                <button
                type="button"
                className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                onClick={handleAbrirModalCrear}
                >
                {/* Ícono + del botón */}
                <i className="bi bi-plus-lg"></i>
                Agregar producto
                </button>
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

                {/* Tabla de productos — solo se muestra cuando hay datos */}
                {!cargando && !error && productos.length > 0 && (
                    <ProductoTable
                    productos={productos}
                    onEditarProducto={handleAbrirModalEditar}
                    onEliminarProducto={handleEliminarProducto}
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