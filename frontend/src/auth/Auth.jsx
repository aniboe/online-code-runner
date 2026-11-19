import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

function Auth() {
    const navigate = useNavigate()

    useEffect(() => {
        let cancelled = false

        async function checkSession() {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_BACKEND_URI}/api/v1/auth/verify`,
                    { credentials: "include" }
                )
                const data = await res.json()

                if (cancelled) return

                if (data.authenticated) {
                    navigate("/code", { replace: true })
                } else {
                    navigate("/?error=unauthorized", { replace: true })
                }
            } catch {
                if (!cancelled) {
                    navigate("/?error=unauthorized", { replace: true })
                }
            }
        }

        checkSession()

        return () => { cancelled = true }
    }, [navigate])

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 font-sans">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                <p className="text-sm font-medium text-zinc-400 tracking-wide">
                    Authenticating session, redirecting...
                </p>
            </div>
        </div>
    )
}

export default Auth
