import mongoose, { Schema } from "mongoose";

const tableSchema=new mongoose.Schema({
    restaurantId:{
        type:Schema.Types.ObjectId,
        ref:'Restaurant'
    },
    tableNumber:{
        type:Number,
        required:true,
    },
    room:{
        type:String,
       default:"main"
    },
    masterQrCode:{
         type:String,
         required:true,
         index:true
    },
    qrCodeUrl:{
        type:String,
        required:true
    },
    sessionToken:{
        type:String,
        default:null
    },
    sessionExpiresAt:{
        type:Date,
        default:null
    },
    status:{
        type:String,
        enum:["free","occupied"],
        default:"free"
    },
    
})

export const Table= 
mongoose.models.Table || 
mongoose.model("Table",tableSchema);