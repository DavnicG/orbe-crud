import { useEffect, useState } from "react";
import {obtenerProductos, crearProducto, eliminarProducto} from '../services/ProductoService';
import ProductoTable from '../components/ProductoTable';
import ProductoForm from "../components/ProductoForm";

function ProductosPage(){
    
    //Estado donde se guardan los productos traidos de Laravel
    const [productos, setProductos] = useState([]);

    //Estado para mostrar mensaje mientras se consulta la API
    const [cargando, setCargando] = useState(true);

    //Estado para capturar errores
    const[error, setError] = useState('');
    
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

    //Esta funcion se llamara cuando el usuario pulse editar
    const handleEditarProducto = (producto) => {
        console.log('Producto a editar:', producto)
    };


    return(
        
        <main className="container py-4">
            {/*Contenedor principal de la pagina */}
            <h1 className="mb-4">Productos Tecnologicos</h1>

            {/*Se muestra el form y se pasa la funcion para crear un producto */}
            <ProductoForm onCrearProducto={handleCrearProducto} />

            {/*Si esta cargando mostramos mensaje de carga */}
            {cargando && <p>Cargando Productos...</p>}

            {/*Mostramos mensajes de error */}
            {error && <p>{error}</p>}

            {/*Si ya no esta cargando, no hay error y el arreglo de productos esta vacio, lo mostramos */}
            {!cargando && !error && productos.length === 0 && (
                <p>No hay productos registrados</p>
            )}

            {/*Si no hay error, no esta cargando y hay productos se renderiza la tabla */}
            {!cargando && !error && productos.length > 0 && (
                <ProductoTable 
                productos={productos}
                onEditarProducto={handleEditarProducto}
                onEliminarProducto={handleEliminarProducto}
                />)}
        </main>
    );
}

export default ProductosPage;