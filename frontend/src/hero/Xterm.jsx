import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit";
import '@xterm/xterm/css/xterm.css'
import { useEffect, useRef, useImperativeHandle, forwardRef } from "react"

const Xterm = forwardRef(({ webSocket, onExecutionEvent }, ref) => {
  const containerRef = useRef(null)
  const terminalInstanceRef = useRef(null)
  const outputEnabledRef = useRef(true)

  // Expose methods to the parent component
  useImperativeHandle(ref, () => ({
    clear: () => {
      if (terminalInstanceRef.current) {
        outputEnabledRef.current = true
        terminalInstanceRef.current.clear()
      }
    },
    stopping: () => {
      if (terminalInstanceRef.current) {
        outputEnabledRef.current = false
        terminalInstanceRef.current.writeln("Stopping execution...")
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
        onExecutionEvent?.(message)
        if (message.type === 'output' || message.type === 'error') {
          if (!outputEnabledRef.current) return
          // Ensure every newline includes a carriage return
          const normalizedData = message.data.replace(/\r?\n/g, "\r\n")
          terminal.write(normalizedData)
        } else if (message.type === 'stopped') {
          terminal.writeln('Execution stopped')
        } else if (message.error) {
          terminal.writeln(message.error)
        }
      } catch (error) {
        console.error('Unable to process WebSocket message:', error)
      }
    }

    // handel terminl input
    webSocket.addEventListener('message', messageHandler)
    let pendingInput = ''
    const dataHandler = terminal.onData((input) => {
      // handel "enter"
      if (input === '\r') { // \r if enter is pressed
        terminal.write('\r\n')
        if (webSocket.readyState === WebSocket.OPEN) {
          webSocket.send(JSON.stringify({ action: 'input', input: pendingInput }))
          pendingInput = ''
        }
        return
      }

      // handel "backspace"
      if (input === '\x7f' || input === '\b') { // both of these are for backspace
        if (pendingInput.length > 0) {
          pendingInput = pendingInput.slice(0, -1)
          terminal.write('\b \b') // \b → Move cursor backward.
                                  // ' ' → Overwrite the character with a space.
                                  // \b → Move cursor backward again.
        }
        return
      }

      pendingInput += input
      terminal.write(input)
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
  }, [webSocket, onExecutionEvent])

  return (
    <div 
      ref={containerRef}
      className="h-full w-full min-h-0 min-w-0"
    />
  )
})

export default Xterm