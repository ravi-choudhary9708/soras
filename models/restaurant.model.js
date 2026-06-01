import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const restaurantSchema= new mongoose.Schema({
    name:{
        type:String,
         required:true,
         lowercase:true,
         trim:true,
         index:true
    },
    phone:{
         type:String,
         required:true,
         trim:true,
         index:true,
         unique:true
    },
    upiId:{
         type:String,
         required:true,
         trim:true,
         index:true,
         unique:true
    },
     plan: { 
        type: String,
     enum: ["trial","monthly"],
      default: "trial"
     },
     isAccountActive: {
        type: Boolean,
        default: true
     },
     graceExpiresAt: { type: Date },
     planExpiresAt: { type: Date }

}, { timestamps: true })

export const Restaurant =
  mongoose.models.Restaurant ||
  mongoose.model("Restaurant", restaurantSchema)





