import jwt from 'jsonwebtoken'
import {UserData} from '../models/userData.js'


export async function verifyToken(token){
    
    if (!token) {
        throw new Error('No token provided');
    }

    const decoded =  jwt.verify(token, process.env.JWT_SECRET);

    // check if user exists in the database
    const user = await UserData.findOne({
        $or:[
            { googleId: decoded?.googleId},
            { email: decoded?.email },
        ]
    }).select("-createdAt -updatedAt -__v");

    if (!user) {
        throw new Error('User not found');
    }
    return user;
}

