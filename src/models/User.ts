import mongoose from "mongoose";
const Schema = mongoose.Schema;

interface User {
    username: string,
    role: 'normalUser' | 'admin',
    password: string,
    refreshToken?: string | undefined
}

const userSchema = new Schema<User> ({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['normalUser', 'admin'],
        default: 'normalUser',
        required: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    refreshToken: { type: String , select: false }
})

export default mongoose.model<User>('User', userSchema);