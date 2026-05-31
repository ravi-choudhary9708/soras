import mongoose, { Schema } from "mongoose";
import { MenuItem } from "./menuItem.model";

const orderItemSchema=new mongoose.Schema({
    menuItemId:{
        type:Schema.Types.ObjectId,
        ref:'MenuItem'
    },
    name:{
         type:String,
         required:true,
         lowercase:true,
         trim:true,
         index:true
    },
    price:{
         type:Number,
         required:true,
         trim:true,
         index:true
    },
    quantity:{
         type:Number,
         required:true,
         index:true
    },
   kotPrintd:{
    type: Boolean,
    default:false,
    
   },
},{timestamps:true})

export const OrderItem= 
mongoose.model.Order || 
mongoose.model("OrderItem",orderItemSchema);