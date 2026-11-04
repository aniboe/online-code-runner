import Monaco from "../hero/guest/Monaco.jsx"
import Xterm from "../hero/guest/Xterm.jsx"
import { webSocket } from "../main.jsx"

function Layout() {

    const handelRunCode = (e) => {
        e.preventDefault()
        webSocket.send('this is message')
    } 

  return (
    <div className="h-screen w-screen flex flex-col"> 
        <header className="h-9 shrink-0 bg-red-700 px-2">
            <h1 className="capitalize text-2xl font-bold">Logo</h1>
        </header>

        <main className="flex-1 min-h-0 flex flex-col">
            <div className=" h-8 shrink-0 flex items-center">

                {/* opened file */}
                <section aria-label="file-selectot" className="bg-blue-600 flex-1 h-full flex items-center gap-2 px-3">
                    <h1>file</h1>
                    <h1>file</h1>
                    <h1>file</h1>
                    <h1>file</h1>
                </section>

                
                {/* options like run clear terminal stop */}
                <section aria-label="controles" className="bg-amber-950 flex-1 flex items-center gap-1.5 h-full px-3">
                    <button className="bg-green-400 px-2 rounded"
                        onClick={handelRunCode}
                    >start</button>
                    <button className="bg-red-400 px-2 rounded"
                        // onClick={}
                    >stop</button>
                    <button className="bg-purple-400 px-2 rounded"
                        // onClick={}
                    >clear</button>
                </section>
            </div>



            <div className="flex flex-1 min-h-0 min-w-0">

                {/* code editor */}
                <section aria-label="editor" className="w-1/2 min-h-0 min-w-0 pt-1 bg-zinc-900">
                    <Monaco/>
                </section>


                {/* terminal */}
                <section aria-label="terminal" className="w-1/2 min-h-0 min-w-0 overflow-hidden bg-blue-600 text-white">
                    <Xterm/>
                </section>
            </div>


        </main>


        {/* some bs */}
        <footer className="bg-pink-600 text-sm font-light text-center">
            this contain i dk   
        </footer>
    </div>
  )
}

export default Layout