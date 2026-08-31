//Recibe el arreglo de productos y crea la tabla
function ProductoTable({ productos, onEditarProducto, onEliminarProducto }) {

  return(
    //table-responsive permite scrool horizontal en pantallas pequeñas
    <div className="table-responsive">
        {/* Clases Bootstrap:
          -table : estilo base de tabla
          -table-striped: filas con franjas
          -table-hover: resalta al pasar el mouse
          -align- middle: centra verticalmente el contenido
        */}
        <table className="table table-striped table-hover align-midle">

          <thead className="table-dark">
            <tr>
              {/*Encabezados de la tabla */}
              <th>Nombre</th>
              <th>Marca</th>
              <th>Categoria</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Descripcion</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {/*Se recogen los productos del arreglo y se crea una fila por cada elemento */}
              {productos.map((producto)=>(
                <tr key={producto.id}>
                    {/*Mostramos cada propiedad en una celda */}
                    <td>{producto.nombre}</td>
                    <td>{producto.marca}</td>
                    <td>{producto.categoria}</td>
                    <td>{producto.precio}</td>
                    <td>{producto.stock}</td>
                    <td>{producto.descripcion || 'Sin descripcion'}</td>
                    <td>
                      {/*Boton para editar*/}
                      <button
                        type="button"
                        className="btn btn-sm btn-warning me-2"
                        onClick={()=> onEditarProducto(producto)}
                      >Editar</button>

                      {/*Boton para eliminar*/}
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={()=> onEliminarProducto(producto)}
                      >Eliminar</button>
                    </td>
                </tr>
              ))}
          </tbody>
        </table>  
    </div>

  );
}

export default ProductoTable;