import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

// List all the builtIn Middlewares

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"})) // for getting the json data from req
app.use(express.urlencoded({extended: true})) // to get the form encoded data from req.body
app.use(express.static("public")) // To specify the static folder
app.use(cookieParser()) // to enable cookie creation and deletion


// Importing Routing 
import userRouter from "./routes/user.route.js"
import subscriptionRouter from "./routes/subscription.route.js"
import videoRouter from "./routes/videos.route.js"
import playlistRouter from "./routes/playlists.route.js"
import commentRouter from "./routes/comments.route.js"
import likesRouter from "./routes/likes.route.js"
import tweetRouter from "./routes/tweets.route.js"

// Base Roution will be here
app.use("/api/v1/users", userRouter);
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/comment", commentRouter)
app.use("/api/v1/likes", likesRouter)
app.use("/api/v1/tweets", tweetRouter)





export { app }

