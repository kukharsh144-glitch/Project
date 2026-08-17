import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
    {
        content: {
            type : String,
            lowerCase : true,
        },
        videos: { 
            type: Schema.Types.ObjectId,
            ref : "Video"
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


export const Comment = mongoose.model("Comment",commentSchema);
// in mongodb it is saved as 'comments'