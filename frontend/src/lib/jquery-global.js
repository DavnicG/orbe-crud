
// Importamos jQuery
import $ from "jquery";

// Lo exponemos de forma global para plugins antiguos que esperan jQuery en window
window.$ = $;
window.jQuery = $;
/*
import "file-saver";
import * as XLSX from "xlsx";
window.XLSX = XLSX;
*/
// Cargamos el plugin DESPUÉS de exponer jQuery y XLSX
//import "tableexport.jquery.plugin";

// También lo exportamos por si queremos reutilizarlo en otros archivos
export default $;