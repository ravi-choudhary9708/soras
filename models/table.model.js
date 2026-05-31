import mongoose, { Schema } from "mongoose";

const tableSchema=new mongoose.Schema({
    restaurantId:{
        type:Schema.Types.ObjectId,
        ref:'Restaurant'
    },
    tableNo:{
        type:Number,
        required:true,
    },
    qrToken:{
         type:String,
         required:true,
         index:true
    },
    status:{
        type:String,
        enum:["free","occupied"],
        default:"free"
    },
    
})

export const Table= 
mongoose.model.Table || 
mongoose.model("Table",tableSchema);