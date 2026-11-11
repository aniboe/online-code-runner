import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRouter from './routes/auth.route.js'
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


// ROUTES

app.use("/api/v1/auth", authRouter)


export default app




