import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';


const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}));
app.use(cookieParser());
app.use(express.json({limit: '16kb'}));
app.use(express.urlencoded({ extended: true , limit: '16kb' }));
app.use(express.static('public'));


// =====================  import router ==============================

import userRouters from "./routes/user.routes.js";
import commentRouters from "./routes/comment.routes.js";
import dashboardRouters from "./routes/dashboard.routes.js";
import healthcheckupRouters from "./routes/healthcheckup.routes.js";
import likeRouters from "./routes/like.routes.js";
import playlistRouters from "./routes/playlist.routes.js";
import subscriptionRouters from "./routes/subscription.routes.js";
import tweetRouters from "./routes/tweet.routes.js";
import videoRouters from "./routes/video.routes.js";

app.use("/api/v1/users", userRouters);
app.use("/api/v1/comments", commentRouters);
app.use("/api/v1/dashboard", dashboardRouters);
app.use("/api/v1/healthcheckup", healthcheckupRouters);
app.use("/api/v1/likes", likeRouters);
app.use("/api/v1/playlists", playlistRouters);
app.use("/api/v1/subscriptions", subscriptionRouters);
app.use("/api/v1/tweets", tweetRouters);
app.use("/api/v1/videos", videoRouters);

// Global error handling middleware to serialize all controller errors (e.g. 409 conflict, 400 bad request)
app.use((err, req, res, next) => {
    // Print the full error details to the server terminal console for real-time debugging
    console.error("Express App Error:", err);

    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    return res.status(statusCode).json({
        statusCode,
        success: false,
        message,
        errors: err.errors || []
    });
});

export { app };