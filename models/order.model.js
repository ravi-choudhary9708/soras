import mongoose, { Schema } from "mongoose";
import { MenuItem } from "./menuItem.model";
import { apiError } from "@/utils/apiError";




const orderSchema=new mongoose.Schema({
    restaurantId:{
        type:Schema.Types.ObjectId,
        ref:'Restaurant',
        index:true
    },
    tableId:{
        type:Schema.Types.ObjectId,
        ref:'Table'
    },
    customerId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        default: null,
        index: true 
    },
    items:{
        type:[OrderItem],
        required:true,
        validate:[
            {
                validator: function(val){
                    return val.length>0
                },
                message:"an order must contain at lest one items"
            }
        ]
    },
   status:{
    type: String,
    enum:["open","billed","paid"],
    default:"open",
    index:true
   },
   paymentMode:{
    type: String,
    enum:["cash","upi","null"],
    default:"null"
   },
   total_amount: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Total amount cannot be negative']
  },
    synced: {
    type: Boolean,
    default: false,
    index: true // Highly helpful for scanning pending synchronization queues fast
  },

  closed_at: {
    type: Date,
    default: null
  }
},{timestamps:true})

orderSchema.pre("save", async function(){
    const order=this;
    try {
        let calculatedTotal=0;
        for(let item of order.items){
            if(!item.name|| !item.price){
                const masterItem= await MenuItem.findById(item.menuItemId);
                if(!masterItem){
                    throw new apiError(404,"masterMenu doesnt exist for this id");
                }

                item.name=masterItem.name;
                item.price=masterItem.price;

            }
            calculatedTotal+=item.price *item.quantity;
        }
        order.total_amount=calculatedTotal;
    } catch (error) {
        throw new apiError(500,"Error calculating order total: "+error.message);
    }
})

export const Order= 
mongoose.model.Order || 
mongoose.model("Order",orderSchema);