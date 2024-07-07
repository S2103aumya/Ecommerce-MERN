if (process.env.NODE_ENV != "production" ) {
    require('dotenv').config();
}

const db="mongodb+srv://saumya:nyHOMhuTz37C8DiE@cluster0.lgvu9e7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

const mongoose = require("mongoose");
const initData = require("./data.js");
const Cart = require("../models/cart.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/ecommerce";


main()
    .then(()=>{
        console.log("connected to db");
    })
    .catch(err => {
        console.log(err)
    });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async()=>{
        await Cart.deleteMany({});
        initData.data= initData.data.map((obj)=>({...obj,owner:'66866bef542b8557298c5220'}));
        await Cart.insertMany(initData.data);
        // console.log(initData.image);
        console.log("data was initialised");
 }

initDB();

