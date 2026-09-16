import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App'
const AdminDashboard = lazy(() => import('./components/AdminDashboard/AdminDashboard'));

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        {window.location.pathname === '/admin' ? <Suspense fallback={<p>Chargement...</p>}><AdminDashboard /></Suspense> : <App />}
    </StrictMode>,
)
