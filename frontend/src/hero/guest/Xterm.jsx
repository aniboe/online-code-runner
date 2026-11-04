import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit";
import '@xterm/xterm/css/xterm.css'
import { useEffect, useRef } from "react"

function Xterm() {
  
  const ref = useRef(null)

  
  useEffect(() => {
    if(!ref.current) return // if div has not been asigned to ref then return

    const terminal = new Terminal({
      cursorBlink: true,
      theme:{
        background: "#0000"
      }
    })
    const fitAddon = new FitAddon();

    terminal.loadAddon(fitAddon);
    terminal.open(ref.current)
    fitAddon.fit()
    terminal.writeln('this a psudo terminal')


    // NOTE-------------------------------------------------
    const observer = new ResizeObserver(() => { // ResizeObserver is builtin in brouser and executs fcunction everytime targeted element changes 
      fitAddon.fit();
    });
    observer.observe(ref.current); // this is what give ResizeObserver , what to observer when resized
    // NOTE-------------------------------------------------








    
    // terminal.onData((input)=> {
    //   terminal.write(input)
    //   if (input === "/r"){
    //     terminal.writeln("")
    //   }
      
    // })
    // do this later?
    
    
    
    
    

    return () =>{ // cleanup function
      observer.disconnect(); // remove old observer instence
      terminal.dispose();
    }
  },[])

  return (
    <div 
      ref={ref}
      className="h-full w-full min-h-0 min-w-0"
    />
  )
}

export default Xterm