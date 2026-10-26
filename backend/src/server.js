import app from './app.js'
import http from 'http'
import { initWS } from './services/webSocket/websocket.js'

const PORT = process.env.PORT

const httpServer = http.createServer({app})
initWS(httpServer)


httpServer.listen(PORT ,() => {
    console.log(`server is runing on http://localhost:${PORT}`)
})