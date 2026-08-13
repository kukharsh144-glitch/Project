import { asyncHandler } from "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import JWT from "jsonwebtoken"
import {User} from "../models/user.model.js"

export const verifyJWT = asyncHandler( async( req, _, next ) => {
    // here we use _ instead of res because their is no use of res in this 
    try{
        const token = req.cookies?.accessToken || req.header( "Authorization" )?.replace( "Bearer ", "" );
        // in the JWT  'Authorization' has "Authorization : Bearer <token>" we need that token for gettin the _id of the user 
        if( !token ){
            throw new apiError( 401, "Unauthorized request" );
        }

        const decodedToken = JWT.verify( token , process.env.ACCESS_TOKEN_SECRET )
        // when we got the token we have to decode and proper decode will be done by providing the token_SECRET and we got the decoded token  
        const user = await User.findById( decodedToken?._id ).select( "-password -refreshToken" )
        // as we got the decoded token we have the id of that user now we can find that user easily by using 'findById'  

        if( !user ){
            throw new apiError( 401, " Invalid acceess token" )
        }

        req.user = user;
        // as we find the user we send that in the req we use it in the logout as req.user
        next();
    }catch ( error ){
        throw new apiError( 401, error?.message || "Invaalid access token" )
    }
})