import ProductosPage from './pages/ProductosPage';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import {AuthProvider} from './context/AuthContext';
import RutaProtegida from './components/RutaProtegida';
import LoginPage from './pages/LoginPage';
import UsuariosPage from './pages/UsuariosPage';

function App(){

    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/*Ruta publica, cualquiera puede ver el login*/}
                    <Route path="/login" element={<LoginPage />}/>
                    
                    {/*Ruta protegida, solo usuarios con sesion activa*/}
                    <Route 
                        path="/productos" 
                        element={
                            <RutaProtegida>
                                <ProductosPage />
                            </RutaProtegida>
                        }
                    />

                    {/* Ruta protegida para gestión de usuarios (solo admin) */}
                    <Route
                    path="/usuarios"
                    element={
                        <RutaProtegida>
                        <UsuariosPage />
                        </RutaProtegida>
                    }
                    />

                    {/*Cualquier otra ruta redirije a productos*/}
                    <Route path="*" element={<ProductosPage />}/>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );  
}

export default App;