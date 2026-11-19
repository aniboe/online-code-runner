import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import RegisterLogin from './auth/RegisterLogin.jsx'
import Auth from './auth/Auth.jsx'
import Layout from './layout/Layout.jsx'

// Fetches /auth/verify once and returns { loading, authenticated }
function useAuth() {
    const [state, setState] = useState({ loading: true, authenticated: false })

    useEffect(() => {
        let cancelled = false

        async function verify() {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_BACKEND_URI}/api/v1/auth/verify`,
                    { credentials: 'include' }
                )
                const data = await res.json()
                if (!cancelled) {
                    setState({ loading: false, authenticated: !!data.authenticated })
                }
            } catch {
                if (!cancelled) {
                    setState({ loading: false, authenticated: false })
                }
            }
        }

        verify()
        return () => { cancelled = true }
    }, [])

    return state
}

// Shows a full-screen spinner while auth state is being determined
function LoadingScreen() {
    return (
        <div className="h-screen w-screen flex items-center justify-center bg-zinc-950">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
    )
}

// Only accessible when NOT authenticated — if user is authed, kick to /code
function PublicRoute({ children }) {
    const { loading, authenticated } = useAuth()
    if (loading) return <LoadingScreen />
    if (authenticated) return <Navigate to="/code" replace />
    return children
}

// Only accessible when authenticated — if not authed, kick to /
function ProtectedRoute({ children }) {
    const { loading, authenticated } = useAuth()
    if (loading) return <LoadingScreen />
    if (!authenticated) return <Navigate to="/" replace />
    return children
}

function App() {
    return (
        <Routes>
            <Route
                path="/"
                element={
                    <PublicRoute>
                        <RegisterLogin />
                    </PublicRoute>
                }
            />
            {/* /auth is the OAuth callback landing page — no guard needed, it handles its own redirect */}
            <Route path="/auth" element={<Auth />} />
            <Route
                path="/code"
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            />
        </Routes>
    )
}

export default App
