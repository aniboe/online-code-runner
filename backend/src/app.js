import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRouter from './routes/auth.route.js'
import path from 'path'

const app = express()




// Changed: use the deployed frontend URL from the environment instead of a hard-coded origin.
// The local fallback keeps the existing Vite development setup working.
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    // credentials is required for the browser to send/store the accessToken cookie.
    credentials: true
}



// syntax // app.use(cors({oprtions}))

app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended: true}))
app.use(express.static("./public"))


// ROUTES

app.use("/api/v1/auth", authRouter)


export default app



