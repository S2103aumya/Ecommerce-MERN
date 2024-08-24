if(process.env.NODE_ENV !== "production"){
    require("dotenv").config();
}

const express = require("express");
const router = express.Router();
const Cart = require("../models/cart.js");
const wrapAsync = require("../utils/wrapAsync.js");



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

module.exports=router;