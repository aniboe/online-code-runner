import { verifyToken } from '../utils/Auth-JWT.js'
import { asyncHandler } from '../utils/AsyncHandler.js'
import { ApiError } from '../utils/ApiError.js'

const ApiVerification = asyncHandler(
    async(req, res, next) => {
        const token = req.cookies?.accessToken

        if(token){
            throw new ApiError(400, "invalid token or token not available")
        }
        
        const isTokenValid = verifyToken(token)
        
        if(!isTokenValid){
            throw new ApiError(400, "invalid token")
        }

        req.user = isTokenValid

        next()
    }
)