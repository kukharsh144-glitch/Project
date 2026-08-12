import {asyncHandler} from "../utils/asyncHandler.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

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


const loginUser = asyncHandler( async( res, req ) => {
    // req body -> data 
    // username, email, password
    // find the user 
    // password
    // access and refresh token 
    // send cookies
    
    const { email, password, userName } = req.body;
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

    const isPasswordValid = await user.isPasswordValid( password );
    if ( !isPasswordValid ) {
        throw new apiError( 401, " password doesn't match " );
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken( user._id );
    const loggedInUser = await userfindById( user._id ).select( "-password -refreshToken" )

    return res
    .status(200)
    .cookie("accessToken ", accessToken , option)
    .cookie("refreshToken ", refreshToken , option)
    .json(new apiResponse( 200, { User : loggedInUser, accessToken, refreshToken } , "logged in successfully " ) );

})

export { registerUser, loginUser };