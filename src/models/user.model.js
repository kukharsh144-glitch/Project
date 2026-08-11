import mongoose , {Schema} from "mongoose";
import bcrypt from "bcrpt";
import { JsonWebTokenError } from "jsonwebtoken";
import { use } from "react";

const userSchema = new Schema (
    {
        userName :{
            type : "String",
            required :true,
            unique : true,
            lowercase: true,
            trim : true,
            index :true   // easy for searching 
        },
        fullName :{
            type : "String",
            required :true,
            lowercase: true,
            trim : true, 
        },
        email : {
            type : "String",
            required : true,
            unique : true,
            index : true,
        },
        avatar : {
            type : "String",  // using third party app   ' cloudinary '
            required : true,
        },
        coverImage : {
            type : "String",  // using third party app   ' cloudinary '
        },
        password:{
            type : "String ",  // we use third party app for hashing purpoose  ' bcrypt ' 
            required : true,
        },
        refreshToken : {
            type : "String",    // for using this we use third party app  ' jsonWebToken'
        },
        watchHistory :{     // for this we the aggregation pipeline method 
            type : Schema.type.objectId,    // that we use in the ' video.modeles.js'
            ref :"video",
        },
    },
    {
        timestamps : true, // it tells  ' createdAt' & ' updatedAt' 
    }
)


// =========================  " password " ====================== 

userSchema.pre("Save", async function (next){
    if(!this.isModified("password"))  return next();  // prevent for run on every click oon save button 

    this.password = bcrypt.hash(this.password, 10)  // hash the the passsword and 10 is the no. oof rounds 
    next();
})

userSchema.methods.ispasswordCorrect = async function(password){ 
    return await bcrypt.compare(password, this.password); //compaire the password and return boolean value
}


// =========================== " tokens " =========================

userSchema.methods.generateAccessToken = function (){
    return  jwt.sign (
        {
            id: this._id,
            email : this.email,
            userName = this.userName,
            fullName : this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expireIn : process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}
userSchema.methods.generateRefreshToken = function (){
    return  jwt.sign (
        {
            id: this._id,

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expireIn : process.env.REFRESH_TOKEN_EXPIRY,
        }
    )
}



export const User = mongoose.model("User", userSchema);
// in mongodb it is saved as ''users'