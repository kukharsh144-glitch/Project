import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema(
    {
        content: {
            type : String,
            lowerCase : true,
        },
        owner: {   
            type: Schema.Types.ObjectId,
            ref : "User"
        },
    },
    {
        timestamps: true, // it tells  ' createdAt' & ' updatedAt' 
    }
)


export const Tweet = mongoose.model("Tweet",tweetSchema);
// in mongodb it is saved as 'tweets'