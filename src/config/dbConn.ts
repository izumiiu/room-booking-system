import mongoose from "mongoose";
import { DATABASE_URI } from "./loadEnv.js";


const connectDB = async () => {
    try{
        await mongoose.connect(DATABASE_URI);
    } catch (err){
        console.log(err);
        process.exit(1);
    }
}

export default connectDB;