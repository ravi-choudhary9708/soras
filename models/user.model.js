import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { apiError } from "@/utils/apiError";

const userSchema= new mongoose.Schema({
    restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true // Every user must belong to a restaurant tenant
},
    username:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true,
    index:true
   } ,
   email:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true,
   } ,
   phone:{
    type:String,
    required:true,
    unique:true,
    trim:true,
   } ,
   fullName:{
    type:String,
    lowercase:true,
    trim:true,
   } ,
     password:{
    type:String,
    required:[true,"password is required"],
    
   },
   role:{
    type:String,
    enum:["manager","staff","chef"],
    default:"staff",
   },
   refreshToken:{
    type:String
   }
},{timestamps:true})

userSchema.pre("save", async function (){
    const user= this;
    //only hash the password if it is modified
    if(!user.isModified("password")){
        return ;
    }
    try {
        const salt= await bcrypt.genSalt(10);
        user.password= await bcrypt.hash(user.password,salt);
        
    } catch (error) {
      throw new apiError(501,"password not hashed")
    }
});

// password compare method
userSchema.methods.isPasswordCorrect= async function (password) {
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken= function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            role: this.role,
            restaurantId: this.restaurantId
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefereshToken= function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
           expiresIn:process.env.REFRESH_TOKEN_EXPIRY 
        }
    )
}

export const User =
  mongoose.models.User ||
  mongoose.model("User", userSchema)