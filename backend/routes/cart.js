if(process.env.NODE_ENV !== "production"){
    require("dotenv").config();
}

const express=require("express");
const router=express.Router();
const Cart=require("../models/cart.js");
const wrapAsync = require("../utils/wrapAsync.js");
const {isLoggedIn,isOwner,validateCart} = require("../middleware.js");
const multer = require("multer");
const { storage } =require("../cloudconfig.js");
const upload = multer({ storage });

router.route("/")
    .get(async(req,res)=>{
        let carts= await Cart.find({});
        res.render("carts/index.ejs",{carts});
    })
    .post(isLoggedIn, upload.single('image'), validateCart,
        wrapAsync(async(req,res)=>{
            try {
                const { cart } = req.body;
                cart.owner = req.user._id;
                if (req.file) {
                    cart.image = req.file.path;
                }
                const newCart = new Cart(cart);
                console.log(newCart);
                await newCart.save();
                req.flash("success", "New cart added successfully");
                res.redirect("/carts");
            } catch (e) {
                next(e);
            }
        }))
//wishlist
router.post("/wishlist/:id",async(req,res)=> {
        const cartItem = await Cart.findById(req.params.id);
        if (!req.session.wishlist) {
            req.session.wishlist = [];
        }
        req.session.wishlist.push(cartItem);
        req.session.itemCount = req.session.wishlist.length;
        req.flash("success","cart added to wishlist succesfully!");
        // res.redirect(`/carts/${req.params.id}`);
        res.redirect("/carts");
});
router.get("/wishlist/view",async(req,res)=>{
    const cartItems = req.session.wishlist || [];
    const itemCount= cartItems.length;
    res.render("carts/wishlist.ejs",{cartItems,itemCount});
});
router.post("/wishlist/view/:id/delete",async(req,res)=>{
    const cartItemId= req.params.id;
    req.session.wishlist = req.session.wishlist.filter(item => item._id.toString() !== cartItemId);
    req.session.itemCount = req.session.wishlist.length;
    res.redirect('/carts/wishlist/view');
})
//viewbag
router.post('/addtobag/:id', async (req, res) => {
    const cartItem = await Cart.findById(req.params.id);
    if (!cartItem) {
        return res.redirect('/carts');
    }

    if (!req.session.cart) {
        req.session.cart = [];
    }
    req.session.cart.push(cartItem);
    req.session.itemCount = req.session.cart.length;
    req.flash("success","cart added to bag successfully!");
    res.redirect('/carts');
});
router.post('/viewbag/:id/delete',async(req,res)=>{
    const cartItemId = req.params.id;
    req.session.cart = req.session.cart.filter(item => item._id.toString() !== cartItemId);
    req.session.itemCount = req.session.cart.length;
    res.redirect('/carts/view');
})
router.get('/view', (req, res) => {
    const cartItems = req.session.cart || []; // Get cart items from session
    const itemCount = cartItems.length; // Get the number of items
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);
    res.render('carts/viewbag.ejs', { cartItems, itemCount, totalPrice }); // Render the view with cart items and item count
});

router.get("/men", async (req, res) => {
    try {
        // Fetch items from the database where the category is "men"
        const menItems = await Cart.find({ category: 'men' });
        // console.log(menItems);
        // Render the men.ejs template with the filtered items
        res.render('carts/men.ejs', { carts: menItems });
    } catch (err) {
        console.error(err);
        res.status(500).send("An error occurred while fetching men's items");
    }
});
router.get("/women",async(req,res)=>{
    const womenItems = await Cart.find({category: 'women'});
    res.render('carts/women.ejs',{ carts: womenItems });
});
router.get("/kids",async(req,res)=>{
    const kidsItems = await Cart.find({category: 'kid'});
    res.render('carts/kids.ejs',{ carts: kidsItems });
});
router.get("/carts/new",isLoggedIn,(req,res)=>{
    if(!req.isAuthenticated()){
        req.flash("error","You must be logged in to add cart");
        res.redirect("/login");
    }
    res.render("carts/new.ejs");
});

router.route("/:id")
    .get(async(req,res)=>{
        let { id } = req.params;
        const cart = await Cart.findById(id).populate({
            path:"reviews",
            populate:{
                path:"author"
            }
        }).populate("owner");
        if(!cart) {
            req.flash("error","Cart does not exist");
            res.redirect("/carts");
        }
        res.render("carts/show.ejs",{cart});
    })
    .put(upload.single('image'),validateCart, isLoggedIn, isOwner,
        async(req,res)=>{
            try{
                let { id }= req.params;
                let cart = await Cart.findById(id);
                if (req.body.cart) {
                    cart.set(req.body.cart);
                }
                if (req.file) {
                    cart.image = req.file.path;
                }
                // await Cart.findByIdAndUpdate(id,{...req.body.cart});
                await cart.save();
                req.flash("success","cart details updated");
                res.redirect(`/carts/${id}`); 
            } catch(e) {
                req.flash('error', 'Failed to update cart');
                next(err);
            }
    })
    .delete(isLoggedIn,isOwner,
        async(req,res)=>{
         let { id }= req.params;
         await Cart.findByIdAndDelete(id);
         req.flash("success","cart deleted successfully!!");
         res.redirect("/carts");
     });

router.get("/:id/edit",
    isLoggedIn,isOwner,
    wrapAsync(async(req,res)=>{
    let { id }= req.params;
    const cart = await Cart.findById(id);
    console.log(cart);
    if(!cart) {
        req.flash("error","Cart does not exist");
        res.redirect("/carts");
    }
    res.render("carts/edit.ejs",{cart});
}));


module.exports=router;