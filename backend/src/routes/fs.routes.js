import { Router } from 'express'
import { testrouter } from '../controllers/fs.controller.js'

const fsRoutes = Router()

fsRoutes.route("/create-file").get(testrouter) // this is a test route that makes new file in cetain lockation

export default fsRoutes