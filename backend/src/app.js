import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import fsRoutes from './routes/fs.routes.js'
import authRouter from './routes/auth.route.js'
import fs from 'fs'
import path from 'path'

const app = express()




// cors configuration
const corsOptions = { 
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'], // dono what this does
    credentials: true
}



// syntax // app.use(cors({oprtions}))

app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(process.cwd(), 'PROJECT-SESSIONS')))


// make project directory if not exists
// (function makeProjectDir() {
//     // console.log('thi is th pah : ',path.resolve("./", 'PROJECT-SECSSIONS'));
    
//     fs.mkdirSync( path.resolve("./", 'PROJECT-SECSSIONS'), {recursive: true} )    
// })()

// function makeProjectDir() {
//     const projectPath = path.resolve('./PROJECT-SESSIONS');

//     if (!fs.existsSync(projectPath)) {
//         fs.mkdirSync(projectPath, { recursive: true });
//     }
// }



// ROUTES
app.use("/api/v1/file-ststem", fsRoutes)

app.use("/api/v1/auth", authRouter)


export default app




