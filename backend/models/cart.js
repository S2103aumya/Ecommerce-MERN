const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const CartSchema = new Schema({
    title: {
        type: String ,
        required:true,
    },
    description: String ,
    image: String,
    price: Number,
    category: String,
    reviews:[
        {
            type:Schema.Types.ObjectId,
            ref : "Review",
        },
    ],
    owner : {
        type:Schema.Types.ObjectId,
        ref: "User",
    },
});

const Cart = mongoose.model("Cart",CartSchema);
module.exports = Cart;