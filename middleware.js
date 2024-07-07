const Cart = require("./models/cart.js");
const {cartSchema , reviewSchema } =require("./schema.js");
const ExpressError = require("./utils/ExpressError.js");
const Review = require("./models/review.js");

module.exports.isLoggedIn=(req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl= req.originalUrl;
        req.flash("error","You must be logged in")
        res.redirect("/login");
    }
    res.locals.currUser = req.user; 
    return next();
}

module.exports.saveRedirectUrl =(req,res,next)=>{
    if(req.session.redirectUrl) {
        res.locals.redirectUrl=req.session.redirectUrl;
    }
    next();
}

module.exports.isOwner = async(req,res,next)=>{
    try{
        let { id } = req.params;
        let cart= await Cart.findById(id);
        if (!cart) {
            req.flash("error", "Cart not found");
            return res.redirect('/carts');
        }
        console.log('Cart owner:', cart.owner); // Debug logging
        console.log('Current user:', res.locals.currUser);
        if(!req.user || !cart.owner || !cart.owner.equals(res.locals.currUser._id)){
            req.flash("error","You aren't the user of this cart");
            return res.redirect(`/carts/${id}`);
        }
        next();
    } catch (error) {
        console.error("Error in isOwner middleware:", error);
        next(error);
    }

}

module.exports.isReviewOwner = async(req,res,next)=>{
    let { id, reviewid } = req.params;
    let review = await Review.findById(reviewid);
    if(!review.author.equals(res.locals.currUser._id)){
        req.flash("error","You aren't the author of this review");
        return res.redirect(`/carts/${id}`);
    }
    next();
}
