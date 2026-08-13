import mongoose, { Schema } from "mongoose";
import { MenuItem } from "./menuItem.model";
import { apiError } from "@/utils/apiError";
import { orderItemSchema } from "./orderItem.model";




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
    tableNumber: {
        type: Number,
        required: true,
        index: true
    },
    sessionToken: {
        type: String,
        required: true,
        index: true
    },
    customerId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        default: null,
        index: true 
    },
    isVerifiedBy:{
        type:Schema.Types.ObjectId,
        ref:'User',
        default:null,
        index:true
    },
    items:{
        type:[orderItemSchema],
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
   PaymentStatus:{
    type: String,
    enum:["open","billed","paid"],
    default:"open",
    index:true
   },
   isVerified:{
    type:Boolean,
    default:false,
     index:true
   },
   paymentMode:{
    type: String,
    enum:["cash","upi"],
    default:"cash"
   },
   totalAmount: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Total amount cannot be negative']
  },
orderStatus:{
    type: String,
    enum:["preparing","ready","served","completed","pending","cancelled"],
    default:"pending",
     index:true
}
},{timestamps:true})

orderSchema.pre("validate", async function(){
    const order=this;
    try {
        let calculatedTotal=0;
        for(let item of order.items){
            if(!item.name || !item.price){
                const masterItem= await MenuItem.findById(item.menuItemId);
                if(!masterItem){
                    throw new apiError(404,"masterMenu doesnt exist for this id");
                }

                // Calculate half portion pricing dynamically
                if (item.portion === 'half') {
                    item.name = masterItem.name + " (Half)";
                    item.price = Math.ceil(masterItem.price / 2); // Round up to nearest whole number if needed
                } else {
                    item.name = masterItem.name;
                    item.price = masterItem.price;
                }
            }
            calculatedTotal += item.price * item.quantity;
        }
        order.totalAmount = calculatedTotal;
    } catch (error) {
        throw new apiError(500,"Error calculating order total: "+error.message);
    }
})

export const Order= 
mongoose.models.Order || 
mongoose.model("Order",orderSchema);