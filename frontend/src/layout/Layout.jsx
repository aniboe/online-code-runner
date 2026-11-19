import { useCallback, useEffect, useRef, useState } from "react"
import Monaco from "../hero/Monaco.jsx"
import Xterm from "../hero/Xterm.jsx"
import { sessionFolderName, webSocket } from "../main.jsx"

// Derive a human-readable label from WebSocket readyState
function wsLabel(readyState) {
    switch (readyState) {
        case WebSocket.CONNECTING: return "Connecting"
        case WebSocket.OPEN:       return "Connected"
        case WebSocket.CLOSING:    return "Closing"
        case WebSocket.CLOSED:     return "Disconnected"
        default:                   return "Unknown"
    }
}

function Layout() {
    const [isRunning, setIsRunning] = useState(false)
    const [projectName, setProjectName] = useState(sessionFolderName)
    const [dockerStatus, setDockerStatus] = useState("Idle")
    const [exitCode, setExitCode] = useState("-")
    // Track live WS readyState so the UI re-renders when it changes
    const [wsStatus, setWsStatus] = useState(() => wsLabel(webSocket.readyState))
    const editorRef = useRef(null)
    const terminalRef = useRef(null)

    // Attach WS lifecycle listeners so React state updates on every transition
    useEffect(() => {
        const onOpen    = () => setWsStatus("Connected")
        const onClose   = () => setWsStatus("Disconnected")
        const onError   = () => setWsStatus("Error")

        // Catch the 'session' message here (Layout-level) so we never miss it.
        // Xterm mounts later and would race against the server's immediate session push.
        const onMessage = (event) => {
            try {
                const msg = JSON.parse(event.data)
                if (msg.type === "session" && msg.folderName) {
                    setProjectName(msg.folderName)
                }
            } catch { /* ignore parse errors — Xterm handles output messages */ }
        }

        // Sync immediately in case the socket already opened before this effect ran
        setWsStatus(wsLabel(webSocket.readyState))

        webSocket.addEventListener("open",    onOpen)
        webSocket.addEventListener("close",   onClose)
        webSocket.addEventListener("error",   onError)
        webSocket.addEventListener("message", onMessage)

        return () => {
            webSocket.removeEventListener("open",    onOpen)
            webSocket.removeEventListener("close",   onClose)
            webSocket.removeEventListener("error",   onError)
            webSocket.removeEventListener("message", onMessage)
        }
    }, [])



    // useEffect(() => console.log("projectName updated:", projectName), [projectName])
    
    

    const handleExecutionEvent = useCallback((message) => {
        if (message.type === "status") {
            setDockerStatus(message.data)
            if (message.data === "error") setIsRunning(false)
        } else if (message.type === "exit") {
            setDockerStatus("Exited")
            setExitCode(String(message.exitCode))
            setIsRunning(false)
        } else if (message.type === "stopped") {
            setDockerStatus("Stopped")
            setIsRunning(false)
        } else if (message.error) {
            setDockerStatus("Error")
            setIsRunning(false)
        }
    }, [])

    async function clearTerminal() {
        if (terminalRef.current) {
            terminalRef.current.clear()
        }
    }

    const handleRunCode = async (e) => {
        e.preventDefault()
        if (!editorRef.current) {
            console.error('Code editor is not ready')
            return
        }

        if (webSocket.readyState !== WebSocket.OPEN) {
            console.error('WebSocket is not connected')
            return
        }

        await clearTerminal()
        setIsRunning(true)
        setDockerStatus("Queued")
        setExitCode("-")
        webSocket.send(JSON.stringify({
            action: 'run',
            code: editorRef.current.getValue()
        }))
    } 

    const handleStopExecution = async (e) => {
        e.preventDefault()
        if (webSocket.readyState !== WebSocket.OPEN) {
            console.error('WebSocket is not connected')
            return
        }
        terminalRef.current?.stopping()
        webSocket.send(JSON.stringify({
            action: 'stop'
        }))
        setIsRunning(false)
    }

    const handleTerminalClear = async (e) => {
        e.preventDefault()
        await clearTerminal()
    }

    // Helper — WS status pill colours
    const getWsBadge = (status) => {
        switch (status) {
            case "Connected":    return { dot: "bg-emerald-400", text: "text-emerald-400" }
            case "Disconnected":
            case "Error":        return { dot: "bg-rose-400",    text: "text-rose-400"    }
            case "Closing":      return { dot: "bg-amber-400",   text: "text-amber-400"   }
            default:             return { dot: "bg-zinc-400 animate-pulse", text: "text-zinc-400" } // Connecting
        }
    }

    // Helper status color indicator
    const getStatusBadge = (status) => {
        switch (status.toLowerCase()) {
            case 'running':
            case 'active':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'error':
            case 'stopped':
                return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            default:
                return 'bg-zinc-800 text-zinc-400 border-zinc-700/50';
        }
    }

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white"> 
            {/* Top Navigation / Header */}
            <header className="h-11 shrink-0 bg-zinc-900 border-b border-zinc-800 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded bg-indigo-600 flex items-center justify-center font-bold text-xs shadow-sm shadow-indigo-500/30">
                        ⚡
                    </div>
                    <h1 className="font-semibold text-sm tracking-wide text-zinc-200">Workspace</h1>
                </div>
                
                {/* Quick actions or project badge in header if needed */}
                <div className="flex items-center gap-2 text-xs font-mono">
                    <span className={`w-2 h-2 rounded-full ${getWsBadge(wsStatus).dot}`} />
                    <span className={getWsBadge(wsStatus).text}>{wsStatus}</span>
                </div>
            </header>

            {/* Main Workspace Area */}
            <main className="flex-1 min-h-0 flex flex-col">
                {/* Toolbar */}
                <div className="h-10 shrink-0 bg-zinc-900/60 border-b border-zinc-800/60 flex items-center px-4">
                    <section aria-label="controls" className="flex items-center gap-2">
                        <button 
                            onClick={handleRunCode}
                            disabled={isRunning}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm ${
                                isRunning 
                                    ? 'bg-emerald-600/50 text-emerald-200 cursor-not-allowed opacity-60' 
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20 active:scale-[0.98]'
                            }`}
                        >
                            <span>▶</span> Run
                        </button>

                        <button 
                            onClick={handleStopExecution}
                            disabled={!isRunning}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                !isRunning 
                                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50' 
                                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-900/20 active:scale-[0.98]'
                            }`}
                        >
                            <span>■</span> Stop
                        </button>

                        <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

                        <button 
                            onClick={handleTerminalClear}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50 transition-all active:scale-[0.98]"
                        >
                            Clear Terminal
                        </button>
                    </section>
                </div>

                {/* Editor & Terminal Split View */}
                <div className="flex flex-col md:flex-row flex-1 min-h-0 min-w-0 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
                    <section aria-label="editor" className="w-full md:w-1/2 h-1/2 md:h-full min-h-0 min-w-0 bg-[#1e1e1e]">
                        <Monaco editorRef={editorRef} />
                    </section>

                    <section aria-label="terminal" className="w-full md:w-1/2 h-1/2 md:h-full min-h-0 min-w-0 overflow-hidden bg-[#18181b]">
                        <Xterm
                            ref={terminalRef}
                            webSocket={webSocket}
                            onExecutionEvent={handleExecutionEvent}
                        />
                    </section>
                </div>
            </main>

            {/* Status Footer */}
            <footer className="h-7 shrink-0 bg-zinc-900 border-t border-zinc-800 px-4 text-xs text-zinc-400 flex items-center justify-between">
                {/* Left — project dir received from WS session message */}
                <div className="flex items-center gap-4 min-w-0">
                    <span className="truncate flex items-center gap-1.5" title={projectName ?? "waiting for session..."}>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span className="font-mono text-zinc-400">
                            {projectName ?? <span className="text-zinc-600 italic">waiting for session...</span>}
                        </span>
                    </span>
                </div>
                
                <div className="flex items-center gap-4 shrink-0 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500">Docker:</span>
                        <span className={`px-1.5 py-0.5 rounded border capitalize ${getStatusBadge(dockerStatus)}`}>
                            {dockerStatus}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500">Exit:</span>
                        <span className="text-zinc-300 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/50">
                            {exitCode}
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Layout