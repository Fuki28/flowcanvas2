import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Login }           from './pages/Login.jsx'
import { Dashboard }       from './pages/Dashboard.jsx'
import { Trabajos }        from './pages/Trabajos.jsx'
import { TrabajoDetalle }  from './pages/TrabajoDetalle.jsx'
import { Configuracion }   from './pages/Configuracion.jsx'
import { Clientes }        from './pages/Clientes.jsx'
import { ProtectedRoute }  from './components/ProtectedRoute.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/trabajos" element={
          <ProtectedRoute><Trabajos /></ProtectedRoute>
        } />
        <Route path="/trabajos/:id" element={
          <ProtectedRoute><TrabajoDetalle /></ProtectedRoute>
        } />
        <Route path="/configuracion" element={
          <ProtectedRoute><Configuracion /></ProtectedRoute>
        } />
        <Route path="/clientes" element={
          <ProtectedRoute><Clientes /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
