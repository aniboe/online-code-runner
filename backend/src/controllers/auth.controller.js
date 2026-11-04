import { asyncHandler } from '../utils/AsyncHandler.js'
import { Oauth } from '../utils/GoogleAuth.js' 
import { ApiError } from '../utils/ApiError.js'
import { UserData } from '../models/userData.js'
import JWT from 'jsonwebtoken'

function createJWT(data){
    const token = JWT.sign(data, process.env.JWT_SECRET)
    return token
}
const cookieOptions = { // set it later while deploying to production
    // secure: process.env.NODE_ENV === 'production',
    // httpOnly: true,
    // sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
}




const redirectToConcentScreen = asyncHandler(
    async(req, res) => {
        // create rediredt uri
        const redirecturi = Oauth.generateAuthUrl(
            {
                access_type: 'offline',
                scope: ['profile', 'email']
            }
        ) 
        res
        .status(200)
        .redirect(redirecturi)
    }
)

const loginOrRegister = asyncHandler(
    async(req, res) => {


        const {code} = req.query

        if(!code){
            throw new ApiError(400, 'ERROR: could not find authentication code')
        }
        
        const {tokens} = await Oauth.getToken(code)
        
        if(!tokens){
            throw new ApiError(400, 'ERROR: could not find verification token code')
        }
        
        const ticket = await Oauth.verifyIdToken(
            {
                idToken: tokens.id_token,
                audience: process.env.CLIENT_ID
            }
        )
        
        if(!ticket){
            throw new ApiError(400, 'ERROR: could not verify the id token')
        }
        
        const payload = ticket.payload
        // console.log("thisis the payload",payload);
        
        if(!payload){
            throw new ApiError(400, 'ERROR: could not find payload from the ticket')
        }

        // check if user exists in database
        const user = await UserData.findOne(
            {
                $or: [
                    {email: payload.email},
                    {googleId: payload.sub}
                ]
            }
        )
        // handel same name issue later

        const userInfo = {
            email: payload.email,
            username: payload.name,
            profilePicture: payload.picture,
            googleId: payload.sub
        }

        const cookie = createJWT(userInfo)

        // if user doesnt exist create a new user in database
        if(user){

            res
            .status(200)
            .cookie('accessToken' ,cookie, cookieOptions)
            .redirect(`${process.env.FRONTEND_URL}/auth`)
            
        }else{
            const createUser = await UserData.create(userInfo)
    
            if(!createUser){
                throw new ApiError(400, 'ERROR: some thing went wrong while logging/registering in user')
            }
            res
            .status(200)
            .cookie('accessToken' ,cookie, cookieOptions)
            .redirect(`${process.env.FRONTEND_URL}/auth`)
        }

    }
)



export {
    redirectToConcentScreen,
    loginOrRegister,
}
