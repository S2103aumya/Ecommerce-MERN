const express = require("express");
const router = express.Router({mergeparams:true});
const passport =require("passport");
const {saveRedirectUrl} = require("../middleware.js");
const wrapAsync= require("../utils/wrapAsync.js");
const User= require("../models/user.js");

router.route("/signup")
    .get((req,res)=>{
    res.render("users/signup.ejs");
    })
    .post(wrapAsync(async(req,res)=>{
        try{
            let { username,email,password} = req.body;
            const newuser = new User({email, username});
            const registereduser = await User.register(newuser,password);
            console.log(registereduser);
            req.login(registereduser,(err)=>{
                if(err){
                    next(err);
                }
                req.flash("success","Welcome to Myntra!!");
                res.redirect("/carts");
            });
        } catch(e){
            req.flash("error", e.message);
            res.redirect("/signup");
        }
    }));

router.route("/login")
    .get((req,res)=>{
        res.render("users/login.ejs");
    })
    .post(saveRedirectUrl,
        passport.authenticate("local",{
            failureRedirect:"/login",
            failureFlash:true,
        }),
        async(req,res)=>{
            req.flash("success","Welcome to Myntra,You are logged in!!");
            let redirect= res.locals.redirectUrl || "/carts";
            res.redirect(redirect);
    });
    
router.get("/logout",(req,res,next)=>{
    req.logout((err)=> {
        if(err){
            next(err);
        }
        req.flash("success","You are logged out!!");
        res.redirect("/carts");
    })
});
module.exports=router;