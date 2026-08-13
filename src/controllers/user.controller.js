import {asyncHandler} from "../utils/asyncHandler.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import  JWT  from "jsonwebtoken"


// in this i want to teell you about the difference b/w 'user' & 'User'   "user" the current user and the accessaries from the module and "User" is all the users that were in the database
// So you need any detail from thee database

const generateAccessAndRefreshToken = async(userId) => {
    //we have to generate the access and refresh token for the login user
    try {

        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        // this are the metthods that we introduce in the user module 

        user.refreshToken = refreshToken;
        // for save it in the user detail
        await user.save({ validateBeforeSave:false })
        // updatee the refresh token in the user in data base without taking any password again or authentication 

        return { accessToken, refreshToken }
    } catch (error) {
        throw new apiError(500, error?.message || " Something went wrong while generating refresh & access token ")
    }
}

const registerUser = asyncHandler(async(req , res ) => {
       // get user details from frontend  (1)
       // validation - notemptty  (2)
       // check is user already exixts : username, email   (3)
       // check for imaages , check for avatar   (4)
       // create user object - create entry in db    (5)
       // remove password and refresh token field from the response   (6)
       // check for user creation  (7)
       // return res  (8) 

    // ==============  1 =======================
    const {fullName, email, password , userName} = req.body;

    if([fullName, email, password , userName].some((field) => field.trim() === "")) {
        throw new apiError(400, "All fields are required ")
    }

    const existedUser = await User.findOne({
        $or: [{userName}, {email}]
    })
    if(existedUser){
        throw new apiError(409, "User is already exist ")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath
    if( req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
        coverImageLocalPath = req.files?.coverImage[0].path;
    }

 if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // ===== 5 ====
    const user = await User.create({
        fullName,
        avatar : avatarLocalPath,
        userName : userName.toLowerCase(),
        email,
        password,
        coverImage : coverImageLocalPath || "",
    })
    // ========= 6 =====
    const createdUser = await User.findById ( user._id ).select( " -password -refreshToken " )
    if( !createdUser ){
        throw new apiError( 500, " something wwwent wrong while registering the user " );
    }


    return res.status(201).json(
        new apiResponse( 200, createdUser, " user registered successfully " )
    )
    }
);


const loginUser = asyncHandler( async( req, res ) => {
    // req body -> data 
    // username, email, password
    // find the user 
    // password
    // access and refresh token 
    // send cookies
    
    const {email, password, userName } = req.body;
    console.log(email);

    if( !(userName || email) ){
        throw new apiError ( 400, " username or email is must required " );
    }

    const user = await User.findOne({
        $or: [ {userName}, {email} ]
    })
    if( !user ){
        throw new apiError( 404, "user is not found" )
    } 

    const isPasswordValid = await user.isPasswordCorrect( password );
    if ( !isPasswordValid ) {
        throw new apiError( 401, " password doesn't match " );
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken( user._id );
    const loggedInUser = await User.findById(user._id).select( "-password -refreshToken" )

    const options = {
        httpOnly : true,
        secure : true ,
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken , options)
    .cookie("refreshToken", refreshToken , options)
    .json(new apiResponse( 200, { User : loggedInUser, accessToken, refreshToken } , "logged in successfully " ) );

})

const logoutUser = asyncHandler( async( req, res ) => {
    // for logout  the we have to fnd the user that was done by the middleware 'auth.middleware.js'
    await User.findByIdAndUpdate( 
        req.user._id,
        { $unset : { refreshToken : 1 } },  // this remove the field from the document 
        { new : true }
    )

    const options = {
        httpOnly : true,
        secure : true,
    }  // this make that the any change in that will done by the server not applicable from the frontend 

    return res
    .status( 200 )
    .clearCookie( "accessToken", options )
    .clearCookie( "refreshToken", options )
    .json( new apiResponse( 200, {}, " User loggeed out successfully " ) )
})


const refreshAccessToken = asyncHandler( async( req, res ) => {
    const inComingRefreshToken = req.cookie.refreshToken || req.body.refreshToken
    if( !inComingRefreshToken ){
        throw new apiError( 401, " unauthorized request " ) 
    }
    try {
        const decodedToken = JWT.verify( inComingRefreshToken, process.env.REFRESH_TOKEN_SECRET )
        const user = await User.findById( decodedToken?._id )
        if( !user ){
            throw new apiError( 401, " invalid refresh token " )
        }
        if(inComingRefreshToken !== user?.refreshToken){
            throw new apiError(401, " refresh token is expired or user is not found " )
        }

        const options= {
            httpOnly : true, 
            secure : true,
        }

        const { accessToken, newRefreshToken} = await generateAccessAndRefreshToken( user._id )
        return res
        .status(200)
        .cookie("acccesToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json( new apiResponse(200, {accessToken, refreshToken : newRefreshToken}, "acceess tokeen refreshed "))
    } catch (error) {
        throw new apiError(401, error?.message || " Invalid refresh token ")
    }
})

export { registerUser, loginUser, logoutUser };