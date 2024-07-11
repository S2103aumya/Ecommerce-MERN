if (process.env.NODE_ENV !== "production" ) {
    require('dotenv').config();
}

const express = require("express");
const app = express();
const path = require("path");
const port = 2103;
const mongoose = require("mongoose");
const Cart = require("./models/cart.js");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const {cartSchema, reviewSchema} = require("./schema.js");
const wrapAsync = require("./utils/wrapAsync.js");
const Review = require("./models/review.js");
const session = require("express-session");
const flash= require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const passportLocalMongoose = require('passport-local-mongoose');
const User = require("./models/user.js");
const moment= require("moment");
const MongoStore = require('connect-mongo');
const {isLoggedIn,isOwner,isReviewOwner} = require("./middleware.js");
const {saveRedirectUrl} = require("./middleware.js");

const multer = require("multer");
const { storage } =require("./cloudconfig.js");
const upload = multer({ storage });

// const MONGO_URL = "mongodb://127.0.0.1:27017/ecommerce"

const dbUrl= process.env.ATLAS_URL;
const secret = process.env.SECRET || 'thisshouldbeabettersecret';

main()
    .then(()=>{
        console.log("connection succesful");
    })
    .catch(err => {
        console.log(err)
    });

async function main() {
   await mongoose.connect(dbUrl);
}


app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended : true}));
app.use(express.static(path.join(__dirname,"public")));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use("/frontend",express.static("frontend.js"));



app.get("/",(req,res)=>{
    res.redirect("/carts");
});

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: "process.env.SECRET"
    },
    touchAfter: 24 * 3600,
});

store.on("error", ()=>{
    console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions=({
    store,
    secret,
    resave: false,
    saveUninitialized : true,
    cookie: {
        expires: Date.now()+ 7*24*60*60*1000,
        maxAge : 7*24*60*60*1000,
        httpOnly: true,
    }
});

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// app.get("/testcart",async(req,res)=>{
//     let samplecart = new Cart({
//         title:"redjacket",
//         description:"this is good jacket",
//         price:800,
//         size:"XL",
//         category:"Female", 
//     });
//     await samplecart.save();
//     console.log("sample was saved");
//     res.send("successful");
// });

const validateCart= (req,res,next)=>{
    let { error } = cartSchema.validate(req.body);
    if(error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}
const validateReview= (req,res,next)=>{
    let { error } = reviewSchema.validate(req.body);
    if(error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}

app.use((req,res,next)=>{
    res.locals.currUser=req.user;
    res.locals.success= req.flash("success");
    res.locals.error= req.flash("error");
    next();
});

app.locals.formatDate = function(date) {
    return moment(date).format('MMMM Do YYYY');
};
//index route
app.get("/carts",async(req,res)=>{
    let carts= await Cart.find({});
    // console.log(req.user);
    res.render("carts/index.ejs",{carts});
});
//new route
app.get("/carts/new",isLoggedIn,(req,res)=>{
    if(!req.isAuthenticated()){
        req.flash("error","You must be logged in to add cart");
        res.redirect("/login");
    }
    res.render("carts/new.ejs");
});

app.get('/carts/men', async (req, res) => {
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
app.get("/carts/women",async(req,res)=>{
    const womenItems = await Cart.find({category: 'women'});
    res.render('carts/women.ejs',{ carts: womenItems });
});
app.get("/carts/kids",async(req,res)=>{
    const kidsItems = await Cart.find({category: 'kid'});
    res.render('carts/kids.ejs',{ carts: kidsItems });
});
//show route
app.get("/carts/:id",async(req,res)=>{
    console.log(req.owner);
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
});
//create route
app.post(
    "/carts",isLoggedIn, upload.single('image'), validateCart,
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
}));
//edit route
app.get("/carts/:id/edit",
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
//update route
app.put(
    "/carts/:id", upload.single('image'),validateCart, isLoggedIn, isOwner,
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
});
//delete route
app.delete("/carts/:id", isLoggedIn,isOwner,
   async(req,res)=>{
    let { id }= req.params;
    await Cart.findByIdAndDelete(id);
    req.flash("success","cart deleted successfully!!");
    res.redirect("/carts");
});


app.post("/carts/:id/reviews", isLoggedIn,
    validateReview,wrapAsync(async(req,res)=>{
    console.log(req.params.id);
    let cart = await Cart.findById(req.params.id);
    let newReview = new Review(req.body.review);
    newReview.author= req.user._id;
    console.log(newReview);

    cart.reviews.push(newReview);
    await newReview.save();
    await cart.save();
    console.log("new review saved");
    req.flash("success","review added successfully!!");
    res.redirect(`/carts/${cart._id}`);
}));

app.delete("/carts/:id/reviews/:reviewid",isLoggedIn,isReviewOwner,
    wrapAsync(async(req,res)=> {
    let {id, reviewid } = req.params;
    await Cart.findByIdAndUpdate(id, {$pull :{reviews:reviewid}});
    await Review.findByIdAndDelete(reviewid);
    req.flash("success","review deleted successfully!!");
    res.redirect(`/carts/${id}`);
}));



app.get("/signup",(req,res)=>{
    res.render("users/signup.ejs");
});
app.post("/signup",wrapAsync(async(req,res)=>{
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
app.get("/login",(req,res)=>{
    res.render("users/login.ejs");
});
app.post("/login",saveRedirectUrl,
    passport.authenticate("local",{
        failureRedirect:"/login",
        failureFlash:true,
    }),
    async(req,res)=>{
        req.flash("success","Welcome to Myntra,You are logged in!!");
        let redirect= res.locals.redirectUrl || "/carts";
        res.redirect(redirect);
})
app.get("/logout",(req,res,next)=>{
    req.logout((err)=> {
        if(err){
            next(err);
        }
        req.flash("success","You are logged out!!");
        res.redirect("/carts");
    })
});

app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page Not found!"));
});
app.use((err,req,res,next)=>{
    let { statusCode = 500, message="Something went wrong!"} = err;
    res.status(statusCode).render("error.ejs",{message});
});

try {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
} catch (error) {
    console.error("An error occurred while starting the server:", error);
}


