import { Router } from 'express'

import { loginOrRegister, redirectToConcentScreen, verifySession } from "../controllers/auth.controller.js";

const authRouter = Router()

authRouter.route('/create-authUri').get(redirectToConcentScreen)
authRouter.route('/callback').get(loginOrRegister)
authRouter.route('/verify').get(verifySession)

export default authRouter