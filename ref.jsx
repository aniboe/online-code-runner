
import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

export default function TerminalDemo() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: "#000000",
      },
    });

    term.open(ref.current);
    term.writeln("Terminal ready.");

    return () => {
      term.dispose();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        height: "100vh",
        background: "#000",
        padding: "10px",
      }}
    />
  );
}
