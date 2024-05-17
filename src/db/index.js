import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const dbConnect = async ()=>{
    try {
        const connection = await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`)
        console.log(`db Successfully connected to: ${connection.connection.host}`)
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}


export {dbConnect}