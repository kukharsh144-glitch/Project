import connectDB from "./db/DbConnection.js";

import dotenv from "dotenv";
dotenv.config({
    path : "./env"
});

connectDB();

