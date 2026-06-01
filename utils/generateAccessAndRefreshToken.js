import { User } from "@/models/user.model"


export const generateAccessAndRefreshToken= async (userId)=>{
    
    const user= await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken= user.generateRefereshToken();
    user.refreshToken=refreshToken;

    await user.save({validateBeforeSave:false});

    return {accessToken, refreshToken};
}