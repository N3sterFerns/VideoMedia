import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        required: true
    },
    coverImage: {
        type: String
    },
    password: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ]
}, { timestamps: true })


// Securing the Password

userSchema.pre("save", async function (next) {
    if (!this.isModified('password')) return next()
    // hash the password
    let hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    next()
})


// Custom Hooks
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

// Access Token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username
    },
        process.env.ACCESS_TOKEN,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

// RefreshToken
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id
    },
        process.env.REFRESH_TOKEN,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    )
}




export const User = mongoose.model("User", userSchema)
