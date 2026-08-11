import mongoose , {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile :{
            type: "String",     // uploade that on ' cloudinary '
            required : true,
        },
        thumbnail :{
            type: "String",
            required : true,
        },
        owner:{
            type : Schema.type.ObjectId,
            ref : "User",
        },
        title :{
            type : "String",
            rrequired : true,
        },
        description :{
            type : "String",
        },
        duaration:{
            type : "Number",    // we get it from the ' cloudinary '
            default : 0,
        },
        views:{
            type : "Number",
            default : 0,    // we have to provide for not taking the garbage value 
        },
        isPublished :{
            type : "Boolean",
            default : true,
        },
    },
    {
        timestamps : true,
    }
)


videoSchema.plugin(mongooseAggregatePaginate);  
// it is used as plugin 
//we can use ' queries ' in this now one of the best methods of that mongoose (useMany , order & so many) 

export const Video = mongoose.model("Video", videoSchema);