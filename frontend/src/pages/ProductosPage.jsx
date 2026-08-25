import { useEffect, useState } from "react";
import {obtenerProductos, crearProducto, eliminarProducto, actualizarProducto} from '../services/ProductoService';
import ProductoTable from '../components/ProductoTable';
import ProductoForm from "../components/ProductoForm";
import ProductoEditModal from "../components/ProductoEditModal"

function ProductosPage(){
    
    //Estado donde se guardan los productos traidos de Laravel
    const [productos, setProductos] = useState([]);

    //Estado para mostrar mensaje mientras se consulta la API
    const [cargando, setCargando] = useState(true);

    //Estado para capturar errores
    const[error, setError] = useState('');

    //Estado que controla si el form de creacion es visible
    const[mostrarFromularioCrear, setMostrarFormularioCrear] = useState(false);

    //Estado con el producto que se esta editando
    const[porductoEditando, setProductoEditando] = useState(null);

    //Estado para mostrar u ocultar el modal de edicion
    const[mostarModalEdicion, setMostrarModalEdicion] = useState(false);
    
    //Esta funcion consulta los productos del backend
    useEffect(()=>{

        const cargarProductos = async () =>{

            try{
                //Llamamos a Service
                const respuesta = await obtenerProductos();

                //Axios guarda el JSON de Laravel en data
                setProductos(respuesta.data);
            }catch(error){
                console.error('Error al consultar productos:', error);
                setError('No se pudieron cargar los productos')
            }finally{
                setCargando(false);
            }
        };
        
        cargarProductos();
    },[]);

    //Esta funcion crea un nuevo producto
    const handleCrearProducto = async (datosProducto) => {

        const respuesta = await crearProducto(datosProducto);

        //Se agrega eñ nevo producto sin recargar la pag
        setProductos ((prevProductos)=> [respuesta.data.data, ...prevProductos]);
    };

    //Cuando el producto fue creado corrrectamente cerramos el form
    const handleProductoCreado = () => {
        setMostrarFormularioCrear(false);
    }

    //Abre el modal de edicion y guarda el producto
    const handleAbrirModalEdicion =(producto) => {
        setProductoEditando(producto);
        setMostrarModalEdicion(true);
    }

    //Cierra el modal y limpia el producto seleccionado
    const handleCerrarModalEdicion = () =>{
        setMostrarModalEdicion(false);
        setProductoEditando(null);
    }

    //Actualiza el producto
    const handleActualizarProducto = async (id, datosProducto) =>{
        const respuesta = await actualizarProducto(id, datosProducto);

        setProductos((prevProductos) =>
            prevProductos.map((producto)=>
                producto.id === id ? respuesta.data.data : producto
            )
        );
    };

    //Esta funcion se llamara cuando el usuario pulse Eliminar
    const handleEliminarProducto = async (id) => {

        //pedimos confirmacion
        const confirmar =window.confirm('¿Seguro que deseas eliminar este producto?');

        //Si el usuario cancela, salimos de la funcion
        if (!confirmar) return;

        //Si el usuario confirma:
        try{
            //Enviamos la peticion del DELETE
            await eliminarProducto(id);

            //Si el backend elimino el producto, lo quitamos 
            setProductos((prevProductos) => prevProductos.filter((producto) => producto.id !== id));
        }catch (error){
            console.error('Error al eliminar producto', error);
            setError ('No se pudo eliminar el producto');
        }
    };

    return(
        
        <main className="container py-4">            {/*Contenedor principal de la pagina */}

            <div className="d-flex justify-content-between aling-items-center mb-4">
                <h1 className="mb-4">Productos Tecnologicos</h1>

                {/*Boton para mostrar o ocultar el form */}
                <button
                    type="button"
                    className={`btn ${mostrarFromularioCrear ? 'btn-outline-secondary' :
                    'btn-primary'}`}
                    onClick={() => setMostrarFormularioCrear(!mostrarFromularioCrear)}
                >
                    {mostrarFromularioCrear ? 'Cerrar formulario' : 'AgregarProducto'}
                </button>
            </div>

            {/*Se muestra el form y se pasa la funcion para crear un producto */}
            {mostrarFromularioCrear && (
                <ProductoForm 
                    onCrearProducto={handleCrearProducto}
                    onProductoCreado={handleProductoCreado} 
                />
            )}

            {/*Si esta cargando mostramos mensaje de carga */}
            {cargando && <p>Cargando Productos...</p>}

            {/*Mostramos mensajes de error */}
            {error && <div className="alert alert-danger">{error}</div>}

            {/*Si ya no esta cargando, no hay error y el arreglo de productos esta vacio, lo mostramos */}
            {!cargando && !error && productos.length === 0 && (
                <div className="alert alert-warning">No hay productos registrados</div>
            )}

            {/*Si no hay error, no esta cargando y hay productos se renderiza la tabla */}
            {!cargando && !error && productos.length > 0 && (
            <ProductoTable 
                productos={productos}
                onEditarProducto={handleAbrirModalEdicion}
                onEliminarProducto={handleEliminarProducto}
                />
            )}

            {/*Modal de edicion */}
            <ProductoEditModal
                visible={mostarModalEdicion}
                producto={porductoEditando}
                onCerrar={handleCerrarModalEdicion}
                onActualizarProducto={handleActualizarProducto}
            />
            
        </main>
    );
}

export default ProductosPage;