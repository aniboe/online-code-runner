import { useRef } from "react"
import Editor from '@monaco-editor/react'


function Monaco() {

    const editorRef = useRef(null) 

  return (
    <Editor 
      height='100%'
      width='100%'
      theme="vs-dark"
      defaultLanguage="javascript"
      defaultValue="console.log('thi is a test ===...>')"
      options={
        {
          // 
        }
      }
    />
  )
}

export default Monaco