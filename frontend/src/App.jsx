import ProductosPage from "./pages/ProductosPage";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import RutaProtegida from "./components/RutaProtegida";
import LoginPage from "./pages/LoginPage";
import UsuariosPage from "./pages/UsuariosPage";
import TwoFactorPage from "./pages/TwoFactorPage";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                        path="/verificar-codigo"
                        element={<TwoFactorPage />}
                    />

                    <Route
                        path="/productos"
                        element={
                            <RutaProtegida>
                                <ProductosPage />
                            </RutaProtegida>
                        }
                    />

                    <Route
                        path="/usuarios"
                        element={
                            <RutaProtegida>
                                <UsuariosPage />
                            </RutaProtegida>
                        }
                    />

                    <Route
                        path="*"
                        element={<Navigate to="/productos" replace />}
                    />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;