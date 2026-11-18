import 'dotenv/config'
import app from './app.js'
import http from 'http'
import { connectMongo } from './mongo/mongo.connect.js'
import fs from 'fs'
import path from 'path'
import { initWS } from './services/webSocket/websocket.js'
import './services/bullmq/worker.js'

const PORT = process.env.PORT || 3000; // note: of no semicolon than it connects with iifi in next line


const httpServer = http.createServer(app) // fumction to be passed not object



// make project directory if not exists
function makeProjectDir() {
    // console.log('thi is th pah : ',path.resolve("./", 'PROJECT-SECSSIONS'));
    fs.mkdirSync( path.resolve("./", 'PROJECT-SECSSIONS'), {recursive: true} )    
}



// initiating a ws connection
initWS(httpServer) // pass the http server to the ws server so that it can listen to the same port



connectMongo()
.then(() => {
    console.log('Connected to MongoDB')

    makeProjectDir() // create project directory if not exists

    httpServer.listen(PORT ,() => {
        console.log(`server is runing on http://localhost:${PORT}`)
    })
})
.catch ((err) => {
    console.error('Unexpected error:', err)
})
