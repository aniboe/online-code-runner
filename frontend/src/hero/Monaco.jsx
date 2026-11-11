import Editor from '@monaco-editor/react'

function Monaco({ editorRef }) {
  return (
    <Editor 
      height='100%'
      width='100%'
      theme="vs-dark"
      defaultLanguage="javascript"
      defaultValue="// write ur conde here"
      onMount={(editor) => {
        editorRef.current = editor
      }}
    />
  )
}

export default Monaco