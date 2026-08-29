import { useEffect, useState } from "react";
import {obtenerProductos, crearProducto, eliminarProducto, actualizarProducto} from '../services/ProductoService';
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
        if(id){
            //Modo edicion
            const respuesta = await actualizarProducto(id, datosProducto);

            setProductos((prevProductos) =>
                prevProductos.map((producto)=>
                    producto.id === id ? respuesta.data.data : producto
                ));
        } else{
            //Modo Creacion
            const respuesta = await crearProducto(datosProducto);

            //Se agrega eñ nevo producto sin recargar la pag
            setProductos ((prevProductos)=> [respuesta.data.data, ...prevProductos]);

        }
    }

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
                className="btn btn-primary"
                onClick={handleAbrirModalCrear}
                >
                Agregar producto
                </button>
            </div>

            {/*Si esta cargando mostramos mensaje de carga */}
            {cargando && <p>Cargando Productos...</p>}

            {/*Mostramos mensajes de error */}
            {error && <div className="alert alert-danger">{error}</div>}

            {/*Mensaje si no hay productos */}
            {!cargando && !error && productos.length === 0 && (
                <div className="alert alert-warning">No hay productos registrados</div>
            )}

            {/*Tabla productos */}
            {!cargando && !error && productos.length > 0 && (
            <ProductoTable 
                productos={productos}
                onEditarProducto={handleAbrirModalEditar}
                onEliminarProducto={handleEliminarProducto}
                />
            )}

            {/*Modal de edicion */}
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