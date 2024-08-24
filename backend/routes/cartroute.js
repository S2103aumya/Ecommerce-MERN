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



router.get('/view', (req, res) => {
    const cartItems = req.session.cart || []; // Get cart items from session
    const itemCount = cartItems.length; // Get the number of items
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);
    res.render('carts/viewbag.ejs', { cartItems, itemCount, totalPrice }); // Render the view with cart items and item count
});
router.get("/savedaddress",async(req,res)=>{
    const cartItems = req.session.cart || [];
    const index=req.body;
    const addressItems = req.session.savedAddresses || [];
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);
    res.render("carts/savedaddress.ejs", { cartItems, addressItems, totalPrice, });
})
router.post("/addresses",async(req,res)=>{
    if (!req.session.address) {
        req.session.address = [];
    }
    if (!req.session.savedAddresses) {
        req.session.savedAddresses = [];
    }
    const addressData= {
        name: req.body.name,
        mobile: req.body.mobileno,
        pincode: req.body.pincode,
        street: req.body.street,
        town: req.body.town,
        city: req.body.city,
        state: req.body.state,
        saveAs: req.body.saveAs || "Home"
    }
    if (req.body.defaultAddress) {
        req.session.defaultAddress = addressData;
    }
    req.session.savedAddresses.push(addressData);
    res.redirect("/carts/savedaddress");
})
router.post("/address/delete",async(req,res)=> {
    const { name, mobile } = req.body;
    req.session.savedAddresses = req.session.savedAddresses.filter(address => 
        !(address.name === name && address.mobile === mobile))
    res.redirect("/carts/savedaddress");
})
//checkout
router.get("/checkout",async(req,res)=>{
    const cartItems = req.session.cart || [];
    const totalPrice= cartItems.reduce((sum,item)=> sum+item.price,0);
    res.render("carts/Payment.ejs",{cartItems,totalPrice});
})

router.get("/checkoutconfirm",async(req,res)=>{
    const selectedAddressId = req.body.selectedAddress;
    const savedAddresses= req.session.savedAddresses || [];
    const selectedAddress = savedAddresses.find(address => address.id === selectedAddressId);
    console.log(selectedAddress);
    res.render("carts/checkoutconfirm.ejs",{ address: selectedAddress });
})

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
        if (!cart.owner) {
            req.flash("error", "Cart owner not found");
            return res.redirect("/carts");
        }
        console.log(cart.owner._id);
        console.log(req.user._id);
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

//wishlist
router.post("/wishlist/:id",async(req,res)=> {
        let { id }= req.params;
        const cartItem = await Cart.findById(req.params.id);
        if (!req.session.wishlist) {
            req.session.wishlist = [];
        }
        req.session.wishlist.push(cartItem);
        req.session.itemCount = req.session.wishlist.length;
        req.flash("success","cart added to wishlist succesfully!");
        // res.redirect(`/carts/${req.params.id}`);
        res.redirect(`/carts/${id}`);
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
//addresspage
router.get("/address/view",async(req,res)=>{
    const cartItems = req.session.cart || []; 
    const addressItems = req.session.savedAddresses || [];
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);
    if(req.session.savedAddresses){
        res.render("carts/savedaddress.ejs", { cartItems, addressItems, totalPrice });
    }
    res.render("carts/address.ejs",{cartItems,totalPrice});
});
router.post("/address/add",async(req,res)=>{
    if (!req.session.address) {
        req.session.address = [];
    }
    req.session.address.push(...req.session.cart); // Add all items in the cart
    res.redirect("/carts/address/view");
})
//address: saved address

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
    res.redirect('/carts/view');
});
router.post('/viewbag/:id/delete',async(req,res)=>{
    const cartItemId = req.params.id;
    req.session.cart = req.session.cart.filter(item => item._id.toString() !== cartItemId);
    req.session.itemCount = req.session.cart.length;
    res.redirect('/carts/view');
})

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