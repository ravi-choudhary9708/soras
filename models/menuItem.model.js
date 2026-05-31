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
    price:{
        type:Number,
         required:true,
    },
    category:{
         type:String,
         lowercase:true,
         trim:true,
         index:true
    },
    isVeg:{
        type:Boolean,
    },
    isAvailable:{
        type:Boolean
    }
})

export const MenuItem= 
mongoose.model.MenuItem || 
mongoose.model("MenuItem",menuItemSchema);