import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
    {
        content: {
            type : String,
            lowercase : true,
        },
        video: { 
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


commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model("Comment",commentSchema);
// in mongodb it is saved as 'comments'