import { useRef, useState } from "react"
import Monaco from "../hero/Monaco.jsx"
import Xterm from "../hero/Xterm.jsx"
import { webSocket } from "../main.jsx"

function Layout() {
    const [isRuning, setIsRuning] = useState(false)
    const editorRef = useRef(null)
    const terminalRef = useRef(null) // 1. Create a ref for the terminal



    async function clearTerminal(){
        if (terminalRef.current) {
            terminalRef.current.clear() // 2. Call the exposed clear method
        }
    }

    const handelRunCode = async (e) => {
        e.preventDefault()
        setIsRuning(true)
        if (!editorRef.current) {
            console.error('Code editor is not ready')
            return
        }

        if (webSocket.readyState !== WebSocket.OPEN) {
            console.error('WebSocket is not connected')
            return
        }

        webSocket.send(JSON.stringify({
            action: 'run',
            code: editorRef.current.getValue()
        }))
        await clearTerminal()
    } 

    const handelStopExeution = async (e) => {
        e.preventDefault()
        webSocket.send(JSON.stringify({
            action: 'stop'
        }))
        if (terminalRef.current && isRuning) {
            await terminalRef.current.stoped() // 2. Call the exposed clear method
        }
        setIsRuning(false)
    }

    const handelTerminalClear = async (e) => {
        e.preventDefault()
        await clearTerminal()
    }

  return (
    <div className="h-screen w-screen flex flex-col"> 
        <header className="h-9 shrink-0 bg-red-700 px-2">
            <h1 className="capitalize text-2xl font-bold">Logo</h1>
        </header>

        <main className="flex-1 min-h-0 flex flex-col">
            <div className=" h-8 shrink-0 flex items-center">
                <section aria-label="controles" className="bg-amber-950 flex-1 flex items-center justify-center gap-1.5 h-full px-3">

                    <button className="bg-green-400 px-2 rounded"
                        onClick={handelRunCode}
                    >start</button>

                    <button className={`bg-red-400 px-2 rounded gra ${!isRuning && "grayscale cursor-not-allowed" }`}
                        disabled = {!isRuning}
                        onClick={handelStopExeution}
                    >stop</button>

                    <button className="bg-purple-400 px-2 rounded"
                        onClick={handelTerminalClear}
                    >clear</button>
                    
                </section>
            </div>

            <div className="flex flex-1 min-h-0 min-w-0">
                <section aria-label="editor" className="w-1/2 min-h-0 min-w-0 pt-1 bg-zinc-900">
                    <Monaco editorRef={editorRef}/>
                </section>

                <section aria-label="terminal" className="w-1/2 min-h-0 min-w-0 overflow-hidden bg-blue-600 text-white">
                    <Xterm ref={terminalRef} webSocket={webSocket}/> {/* 3. Attach ref here */}
                </section>
            </div>
        </main>

        <footer className="bg-pink-600 text-sm font-light text-center">
            this contain i dk   
        </footer>
    </div>
  )
}

export default Layout