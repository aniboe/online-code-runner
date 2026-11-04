import mongoose from 'mongoose'

const userDataSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
    },
    profilePicture: {
        type: String,
        default: null
    },
    googleId: {
        type: String,
        required: true,
    }
},{timestamps: true}
)

export const UserData = mongoose.model('UserData', userDataSchema)