import Editor from '@monaco-editor/react'

function Monaco({ editorRef }) {
  return (
    <Editor 
      height='100%'
      width='100%'
      theme="vs-dark"
      defaultLanguage="javascript"
      // defaultValue="console.log('helo')"
      defaultValue="import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter your name: ', function(input) {
    console.log('Your input is:', input);
    rl.close();
})"
      onMount={(editor) => {
        editorRef.current = editor
      }}
    />
  )
}

export default Monaco