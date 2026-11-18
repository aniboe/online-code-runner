import { useCallback, useRef, useState } from "react"
import Monaco from "../hero/Monaco.jsx"
import Xterm from "../hero/Xterm.jsx"
import { webSocket } from "../main.jsx"

function Layout() {
    const [isRuning, setIsRuning] = useState(false)
    const [projectName, setProjectName] = useState("Connecting...")
    const [dockerStatus, setDockerStatus] = useState("Idle")
    const [exitCode, setExitCode] = useState("-")
    const editorRef = useRef(null)
    const terminalRef = useRef(null)

    const handleExecutionEvent = useCallback((message) => {
        if (message.type === "session" && message.folderName) {
            setProjectName(`${message.folderName}`)
        } else if (message.type === "status") {
            setDockerStatus(message.data)
            if (message.data === "error") setIsRuning(false)
        } else if (message.type === "exit") {
            setDockerStatus("Exited")
            setExitCode(String(message.exitCode))
            setIsRuning(false)
        } else if (message.type === "stopped") {
            setDockerStatus("Stopped")
            setIsRuning(false)
        } else if (message.error) {
            setDockerStatus("Error")
            setIsRuning(false)
        }
    }, [])

    async function clearTerminal(){
        if (terminalRef.current) {
            terminalRef.current.clear()
        }
    }

    const handelRunCode = async (e) => {
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
        setIsRuning(true)
        setDockerStatus("Queued")
        setExitCode("-")
        webSocket.send(JSON.stringify({
            action: 'run',
            code: editorRef.current.getValue()
        }))
    } 

    const handelStopExeution = async (e) => {
        e.preventDefault()
        if (webSocket.readyState !== WebSocket.OPEN) {
            console.error('WebSocket is not connected')
            return
        }
        terminalRef.current?.stopping()
        webSocket.send(JSON.stringify({
            action: 'stop'
        }))
        setIsRuning(false)
    }

    const handelTerminalClear = async (e) => {
        e.preventDefault()
        await clearTerminal()
    }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden"> 
        <header className="h-9 shrink-0 bg-red-700 px-2 flex items-center">
            <h1 className="capitalize text-xl font-bold text-white">Logo</h1>
        </header>

        <main className="flex-1 min-h-0 flex flex-col">
            <div className="h-8 shrink-0 flex items-center">
                <section aria-label="controles" className="bg-amber-950 flex-1 flex items-center justify-center gap-1.5 h-full px-3">
                    <button className="bg-green-400 px-2 rounded text-sm font-medium"
                        onClick={handelRunCode}
                    >start</button>

                    <button className={`bg-red-400 px-2 rounded text-sm font-medium ${!isRuning && "grayscale cursor-not-allowed"}`}
                        disabled={!isRuning}
                        onClick={handelStopExeution}
                    >stop</button>

                    <button className="bg-purple-400 px-2 rounded text-sm font-medium"
                        onClick={handelTerminalClear}
                    >clear</button>
                </section>
            </div>

            {/* Responsive split: stacked column on mobile, row on md+ screens */}
            <div className="flex flex-col md:flex-row flex-1 min-h-0 min-w-0">
                <section aria-label="editor" className="w-full md:w-1/2 h-1/2 md:h-full min-h-0 min-w-0 pt-1 bg-zinc-900">
                    <Monaco editorRef={editorRef}/>
                </section>

                <section aria-label="terminal" className="w-full md:w-1/2 h-1/2 md:h-full min-h-0 min-w-0 overflow-hidden bg-blue-600 text-white">
                    <Xterm
                        ref={terminalRef}
                        webSocket={webSocket}
                        onExecutionEvent={handleExecutionEvent}
                    />
                </section>
            </div>
        </main>

        <footer className="h-7 shrink-0 bg-pink-600 px-3 text-xs font-light text-white flex items-center justify-between">
            <span className="min-w-0 truncate" title={projectName}>
                Project: {projectName}
            </span>
            <span className="shrink-0 capitalize">Docker: {dockerStatus}</span>
            <span className="shrink-0">Exit code: {exitCode}</span>
        </footer>
    </div>
  )
}

export default Layout