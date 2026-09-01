import { useEffect, useRef } from "react";
import $ from "../lib/jquery-global";
import "bootstrap-table/dist/bootstrap-table.min.css";
import "bootstrap-table/dist/bootstrap-table.min.js"
import "bootstrap-table/dist/locale/bootstrap-table-es-MX.min.js"



//Recibe el arreglo de productos y crea la tabla
function ProductoTable({ productos, onEditarProducto, onEliminarProducto }) {

  //Referencia directa a la tabla HTML  
  const tableRef = useRef(null);

  // Referencias para guardar las funciones actuales y que los eventos del plugin
  // siempre usen la versión más reciente sin reinicializar toda la tabla
  const editarRef = useRef(onEditarProducto);
  const eliminarRef = useRef(onEliminarProducto);

  // Actualizamos las referencias cuando cambian las props
  useEffect(() => {
    editarRef.current = onEditarProducto;
    eliminarRef.current = onEliminarProducto;
  }, [onEditarProducto, onEliminarProducto]);

    // Este efecto inicializa Bootstrap Table una sola vez
    useEffect(()=>{
    //Si la tabla aun no existe en el DOM, no hacemos nada
    if(!tableRef.current) return;
  
    //Guardamos la referencia jQuery de la tabla
    const $table = $(tableRef.current);

    //Iniciamos Bootstrap Table con las opciones deseadas
    $table.bootstrapTable({
      data: [], //La tabla se crea vacia
      search: true, //habilita la barra de busqueda
      pagination: true, //Habilita la paginacion
      pageSize: 5,  //Cantidad de filas por pagina
      pageList: [5,10,20,50],  //Opciones de filas por pag
      showRefresh: true,  //Muestra el boton para refrescar
      showToggle: true, //Permite alternar vista tabla/tarjetas
      showColumns: true, // Mostrar/ocultar columnas
      striped: true,  //Filas con estilo alternativo
      sortable: true, //Permite ordenamiento global en columnas marcadas
      locale: "es-MX",  //idioma
      classes: "table table-striped table-hover", //Clases de estilo Bootstrap
      uniqueId: "id", //Campo unico de cada fila
      iconsPrefix: "bi",
      icons: {
        refresh: "bi-arrow-clockwise",
        toggleOff: "bi-toggle-off",
        toggleOn: "bi-toggle-on",
        columns: "bi-list-ul",
        fullscreen: "bi-arrows-fullscreen",
        detailOpen: "bi-plus",
        detailClose: "bi-dash"
      },
      columns:[
        {
          field: "nombre",
          title: "Nombre",
          sortable: true,
        },
                {
          field: "marca",
          title: "Marca",
          sortable: true,
        },
                {
          field: "categoria",
          title: "Categoria",
          sortable: true,
        },
                {
          field: "precio",
          title: "Precio",
          sortable: true,
          formatter: (value) => `$ ${value}`, //Formato basico para mostrar precio
        },
                {
          field: "stock",
          title: "Stock",
          sortable: true,
        },
                {
          field: "descripcion",
          title: "Descripcion",
          formatter: (value) => value || "Sin descripcion",
        },
                {
          field: "acciones",
          title: "Acciones",
          align: "center",
          searchable: false,
          clickToSelect:false,
          formatter: () =>{
            //Este HTML lo renderiza BootstrapTable dentro de la columna
            return `
              <button class="btn btn-sm btn-warning btn-editar me-2">Editar</button>
              <button class="btn btn-sm btn-danger btn-eliminar">Eliminar</button>
            `;
          },
          events: {
            //Evento para el boton Editar dentro de la fila
            "click .btn-editar": (e,value,row) => {
              editarRef.current(row);
            },
            //Evento para el boton Eliminar dentro de la fila
            "click .btn-eliminar": (e, value, row) =>{
              eliminarRef.current(row);
            },
          },
        },
      ],
    });
      //Cleanup: destruimos la tabla cuando el componente se desmonta o antes de volver a iniciarla
      return () =>{
        $table.bootstrapTable("destroy");
      };
    }, []);

    //Este efecto solo recarga los datos  cuando cambia el arreglo de productos
    useEffect(()=>{
      if (!tableRef.current) return;

      const $table = $(tableRef.current);

      //Remplaza los datos actuales sin reconstruir la tabla
      $table.bootstrapTable("load", productos);
    }, [productos]);

    return (
      //Solo dejamos la tabla vacia: Bootstrap Table la llenara con JavaScript
      <div className="table-responsive">
        <table ref={tableRef}></table>
      </div>
    );
  }

export default ProductoTable;