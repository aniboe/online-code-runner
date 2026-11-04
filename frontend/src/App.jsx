import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { Routes, Route} from 'react-router-dom'
import RegisterLogin from './auth/RegisterLogin.jsx'
import Layout from './layout/Layout.jsx'
import Auth from './auth/Auth.jsx';

function App() {
  return (
    <>
      <Routes>
        <Route path='/' element={<RegisterLogin/>}/>
        <Route path='/auth' element={<Auth/>}/>
        <Route path='/code' element={<Layout/>}/>
      </Routes>
    </>
  )
}

export default App