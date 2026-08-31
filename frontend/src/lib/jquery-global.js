// Importamos jQuery
import $ from "jquery";

// Lo exponemos de forma global para plugins antiguos que esperan jQuery en window
window.$ = $;
window.jQuery = $;

// También lo exportamos por si queremos reutilizarlo en otros archivos
export default $;