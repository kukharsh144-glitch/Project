import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
    {
        comment: {
            type : Schema.Types.ObjectId,
            ref :  "Comment",
        },
        video: { 
            type: Schema.Types.ObjectId,
            ref : "Video"
        },
        likedby: {   
            type: Schema.Types.ObjectId,
            ref : "User"
        },
        tweet : {
            type : Schema.Types.ObjectId,
            ref :  "Tweet",
        }
    },
    {
        timestamps: true, // it tells  ' createdAt' & ' updatedAt' 
    }
)


export const Like = mongoose.model("Like",likeSchema);
// in mongodb it is saved as 'likes'