if (process.env.NODE_ENV != "production" ) {
    require('dotenv').config();
}

const mongoose = require("mongoose");
const dotenv= require('dotenv');
dotenv.config({path:'../.env' });
const initData = require("./data.js");
const Cart = require("../models/cart.js");

// const MONGO_URL = "mongodb://127.0.0.1:27017/ecommerce";
console.log("ATLAS_URL:", process.env.ATLAS_URL);
console.log("SECRET:", process.env.SECRET);
const dbUrl= process.env.ATLAS_URL;
const secret = process.env.SECRET || 'thisshouldbeabettersecret';


main()
    .then(()=>{
        console.log("connected to db");
    })
    .catch(err => {
        console.log(err)
    });

async function main() {
  await mongoose.connect(dbUrl);
}

const initDB = async()=>{
        await Cart.deleteMany({});
        initData.data= initData.data.map((obj)=>({...obj,owner:'66866bef542b8557298c5220'}));
        await Cart.insertMany(initData.data);
        // console.log(initData.image);
        console.log("data was initialised");
 }

initDB();

