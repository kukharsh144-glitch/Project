import mongoose , {Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema (
    {
       userName: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true, 
            index: true     // used for finding easily 
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowecase: true,
            trim: true, 
        },
        fullName: {
            type: String,
            required: true,
            trim: true, 
            index: true
        },
        avatar: {
            type: String, // cloudinary url
            required: true,
        },
        coverImage: {
            type: String, // cloudinary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        }
    },
    {
        timestamps : true, // it tells  ' createdAt' & ' updatedAt' 
    }
)


// =========================  " password " ====================== 

userSchema.pre("save", async function (next){
    if(!this.isModified("password"))  return ;  // prevent for run on every click oon save button 

    this.password = await bcrypt.hash(this.password, 10)  // hash the the passsword and 10 is the no. oof rounds 
})

userSchema.methods.isPasswordCorrect = async function(password){ 
    return await bcrypt.compare(password, this.password); //compaire the password and return boolean value
}


// =========================== " tokens " =========================

userSchema.methods.generateAccessToken = function (){
    return  jwt.sign (
        {
            _id: this._id,
            email : this.email,
            userName : this.userName,
            fullName : this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}
userSchema.methods.generateRefreshToken = function (){
    return  jwt.sign (
        {
            _id: this._id,

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY,
        }
    )
}



export const User = mongoose.model("User", userSchema);
// in mongodb it is saved as ''users'