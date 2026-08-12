import {asyncHandler} from "../utils/asyncHandler.js"

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

    if([fullName, email, password , userName].Some((field) => field.trim() === "")) {
        throw new apiError(400, "All fields are required ")
    }

    const existedUser = await UserActivation.findOne({
        $or: [{userName}, {email}]
    })
    if(existedUser){
        throw new apiError(409, "User is already exist ")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath
    if( req.file && Array.isArray(req.files.coverImage) && req.files.coverImag.length > 0 ){
        const coverImageLocalPath = req.files?.coverImage[0].path;
    }

    if(!avatar){
        throw new apiError( 400, "Avatar file is required" )
    }

    // ===== 5 ====
    const User = await User.create({
        fullName,
        avatar : avatarLocalPath,
        userName : userName.toLowerCase(),
        email,
        passsword,
        coverImage : coverImageLocalPath || "",
    })
    // ========= 6 =====
    const createdUser = await userName.findById ( User._id ).select( " -password -refreshToken " )
    if( !createdUser ){
        throw new apiError( 500, " something wwwent wrong while registering the user " );
    }


    return res(201).json(
        new apiResponse( 200, createdUser, " user registered successfully " )
    )
    }
),


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

    const User = await User.findOne({
        $or: [ {userName}, {email} ]
    })
    if( !User ){
        throw new apiError( 404, "user is not found" )
    } 

    const isPasswordValid = await User.isPasswordValid( password );
    if ( !isPasswordValid ) {
        throw new apiError( 401, " password doesn't match " );
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken( User._id );
    const loggedInUser = await userfindById( User._id ).select( "-password -refreshToken" )

    return res
    .status(200)
    .cookie("accessToken ", accessToken , option)
    .cookie("refreshToken ", refreshToken , option)
    .json(new apiResponse( 200, { User : loggedInUser, accessToken, refreshToken } , "logged in successfully " ) );

})

export { registerUser };