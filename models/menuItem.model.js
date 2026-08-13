import mongoose, { Schema } from "mongoose";

const menuItemSchema=new mongoose.Schema({
    restaurantId:{
        type:Schema.Types.ObjectId,
        ref:'Restaurant'
    },
    name:{
         type:String,
         required:true,
         lowercase:true,
         trim:true,
         index:true
    },
    description:{
        type:String,
        lowercase:true,
        trim:true,
    },
    image:{
       type:String,
    },
    price:{
        type:Number,
         required:true,
    },
    category:{
         type:String,
         lowercase:true,
         required:true,
         trim:true,
         index:true
    },
    isVeg:{
        type:Boolean,
    },
    isAvailable:{
        type:Boolean,
        default:true
    },
    isHalfAllowed:{
        type:Boolean,
        default:false
    }
})

export const MenuItem= 
mongoose.models.MenuItem || 
mongoose.model("MenuItem",menuItemSchema);