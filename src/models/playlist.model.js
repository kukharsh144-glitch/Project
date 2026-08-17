import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema(
    {
        name: {  
            type: String,
            required : true,
            index : true,
            lowercase : true,
        },
        description: {
            type : String,
            lowercase : true,
        },
        videos: [
            { 
            type: Schema.Types.ObjectId,
            ref : "Video"
            }
        ],
        owner: {   
            type: Schema.Types.ObjectId,
            ref : "User"
        },
    },
    {
        timestamps: true, // it tells  ' createdAt' & ' updatedAt' 
    }
)


export const Playlist = mongoose.model("Playlist",playlistSchema);
// in mongodb it is saved as ''playlists'