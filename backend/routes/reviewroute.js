if(process.env.NODE_ENV !== "production"){
    require("dotenv").config();
}

const express= require("express");
const router = express.Router({ mergeParams: true });
const Review= require("../models/review.js");
const Cart= require("../models/cart.js");
const wrapAsync = require("../utils/wrapAsync.js");
const {isLoggedIn,isReviewOwner,validateReview} = require("../middleware.js");

router.post("/", isLoggedIn,
    validateReview,wrapAsync(async(req,res)=>{
    let cart = await Cart.findById(req.params.id);
    let newReview = new Review(req.body.review);
    newReview.author= req.user._id;
    console.log(newReview);

    cart.reviews.push(newReview);
    await newReview.save();
    await cart.save();
    req.flash("success","review added successfully!!");
    res.redirect(`/carts/${cart._id}`);
}));
 
router.delete("/:reviewid",isLoggedIn,isReviewOwner,
    wrapAsync(async(req,res)=> {
    let {id, reviewid } = req.params;
    await Cart.findByIdAndUpdate(id, {$pull :{reviews:reviewid}});
    await Review.findByIdAndDelete(reviewid);
    req.flash("success","review deleted successfully!!");
    res.redirect(`/carts/${id}`);
}));

module.exports =router;