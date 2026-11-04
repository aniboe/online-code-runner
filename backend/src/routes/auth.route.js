import { Router } from 'express'

import { loginOrRegister, redirectToConcentScreen } from "../controllers/auth.controller.js";

const authRouter = Router()

authRouter.route('/create-authUri').get(redirectToConcentScreen)
authRouter.route('/callback').get(loginOrRegister)

export default authRouter