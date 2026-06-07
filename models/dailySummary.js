import mongoose, { Schema } from "mongoose";

// 1. Subschema for tracking best-selling dishes cleanly
const TopItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  totalQuantitySold: {
    type: Number,
    required: true,
    default: 0
  },
  totalRevenueGenerated: {
    type: Number,
    required: true,
    default: 0
  }
}, { _id: false }); // Drop inner subdocument IDs to minimize index overhead

const dailySummarySchema=new mongoose.Schema({
    restaurantId:{
        type:Schema.Types.ObjectId,
        ref:'Restaurant'
    },
   
    date:{
        type:Date,
         required:true,
    },
    totalCash:{
         type:Number,
         default:0,
         min:[0,"cash cant be negative"]
    },
    toatlUpi:{
         type:Number,
          default:0,
         min:[0,"upi cant be negative"]
    },
    totalOrder:{
         type:Number,
          default:0,
         min:[0,"total order cant be negative"]
    },
    topItems:{
         type:[TopItemSchema],
         default:0
    },
    
},{timestamps:true})

dailySummarySchema.index({ restaurantId: 1, date: -1 }); 

export const DailySummary= 
mongoose.models.DailySummary || 
mongoose.model("DailySummary",dailySummarySchema);