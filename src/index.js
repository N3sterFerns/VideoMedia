import { app } from "./app.js";
import dotenv from "dotenv"
import {dbConnect} from "./db/index.js"


dotenv.config({  // for taking the environmental vairables
    path: "./.env"
})


dbConnect()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log("Listening...")
    })
})
.catch((err)=>{
    console.log(err)
})









