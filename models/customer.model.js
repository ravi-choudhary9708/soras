import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { apiError } from "@/utils/apiError";

const customerSchema=new Schema({
    name:{
        type:String,
        required:true,
        lowercase:true,
        trim:true
    },
    phone:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        index:true
    },
    password:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    role:{
        type:String,
        default:"customer",
        immutable:true
    },
    visitedRestaurants:[{
        type:Schema.Types.ObjectId,
        ref:'Restaurant'
    }],
    orderHistory:[{
        type:Schema.Types.ObjectId,
        ref:'Order'
    }],
    whatsappOptIn:{
        type:Boolean,
        default:false
    },
},{timestamps:true});

customerSchema.pre("save", async function (){
    const customer= this;
    //only hash the password if it is modified
    if(!customer.isModified("password")){
        return ;
    }
    try {
        const salt= await bcrypt.genSalt(10);
        customer.password= await bcrypt.hash(customer.password,salt);
        
    } catch (error) {
      throw new apiError(501,"password not hashed")
    }
});

// password compare method
customerSchema.methods.isPasswordCorrect= async function (password) {
    return await bcrypt.compare(password,this.password);
}

customerSchema.methods.generateAccessToken= function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            role: this.role,
            restaurantId: this.restaurantId
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
        expiresIn:"30d"
        }
    )
}

customerSchema.methods.generateRefreshToken= function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
           expiresIn:"365d"
        }
    )
}


export const Customer= mongoose.models.Customer || mongoose.model("Customer",customerSchema);

