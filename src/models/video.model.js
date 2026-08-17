import mongoose , {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile :{
            url :{
                type: "String",
                required : true,
            }, 
            publicId :{
                type: "String",
                required : true,
            }
        },
        thumbnail :{
            url :{
                type: "String",
                required : true,
            }, 
            publicId :{
                type: "String",
                required : true,
            }
        },
        owner:{
            type : Schema.Types.ObjectId,
            ref : "User",
        },
        title :{
            type : "String",
            required : true,
        },
        description :{
            type : "String",
        },
        duration:{
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