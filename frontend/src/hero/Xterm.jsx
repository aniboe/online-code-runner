import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit";
import '@xterm/xterm/css/xterm.css'
import { useEffect, useRef, useImperativeHandle, forwardRef } from "react"

const Xterm = forwardRef(({ webSocket }, ref) => {
  const containerRef = useRef(null)
  const terminalInstanceRef = useRef(null)

  // Expose methods to the parent component
  useImperativeHandle(ref, () => ({
    clear: () => {
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.clear()
      }
    },
    stoped: () => {
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.writeln("execution stoped")
      }
    }
  }))

  useEffect(() => {
    if(!containerRef.current) return

    const terminal = new Terminal({
      cursorBlink: true,
      theme:{
        background: "#0000"
      }
    })

    terminalInstanceRef.current = terminal
    const fitAddon = new FitAddon();

    terminal.loadAddon(fitAddon);
    terminal.open(containerRef.current)
    fitAddon.fit()

    // const messageHandler = (event) => {
    //   try {
    //     const message = JSON.parse(event.data)
    //     if (message.type === 'output' || message.type === 'error') {
    //       terminal.write(message.data)
    //     } else if (message.error) {
    //       terminal.writeln(message.error)
    //     }
    //   } catch (error) {
    //     console.error('Unable to process WebSocket message:', error)
    //   }
    // }

    const messageHandler = (event) => { // look into how this
      try {
        const message = JSON.parse(event.data)
        if (message.type === 'output' || message.type === 'error') {
          // Ensure every newline includes a carriage return
          const normalizedData = message.data.replace(/\r?\n/g, "\r\n")
          terminal.write(normalizedData)
        } else if (message.error) {
          terminal.writeln(message.error)
        }
      } catch (error) {
        console.error('Unable to process WebSocket message:', error)
      }
    }

    webSocket.addEventListener('message', messageHandler)
    const dataHandler = terminal.onData((input) => {
      if (webSocket.readyState === WebSocket.OPEN) {
        webSocket.send(JSON.stringify({ action: 'input', input }))
      }
    })

    const observer = new ResizeObserver(() => {
      fitAddon.fit();
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      webSocket.removeEventListener('message', messageHandler)
      dataHandler.dispose()
      terminal.dispose();
      terminalInstanceRef.current = null;
    }
  }, [webSocket])

  return (
    <div 
      ref={containerRef}
      className="h-full w-full min-h-0 min-w-0"
    />
  )
})

export default Xterm