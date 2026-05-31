// receive data as image->validate
// find restaurant->validtae
// upload to cloudinary
// save payment details with image url in db
// return res   

import { NextResponse } from "next/server";

const function submitPayment(req){
    try {
        await dbConnect();
        const currentUser= req.user;
        if(currentUser.role!="manager"||!currentUser ){
            return NextResponse.json(new apiError(401,"unauthorized"));
        }
        const {screenshot}= await req.json();
        if(!screenshot){
            return NextResponse.json(new apiError(401,"payment screenshot is required"));
        }
        const restaurant= await Restaurant.findById(currentUser.restaurantId);
        if(!restaurant){
            return NextResponse.json(new apiError(404,"restaurant not found"));
        }
      const uploadedImage= await cloudinary.uploader.upload(screenshot,"soras/paymentProof");
        if(!uploadedImage || !uploadedImage.secure_url){
            return NextResponse.json(new apiError(500,"image upload failed"));
        }
        

    } catch (error) {
        
    }
}