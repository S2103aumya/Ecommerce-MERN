const Joi= require("joi");

module.exports.cartSchema = Joi.object({
     cart: Joi.object({
        title:Joi.string().required(),
        description:Joi.string().required(),
        image:Joi.string().allow("",null),
        price:Joi.number().required(),
        category:Joi.string().required(),
    }).required()
});
 
module.exports.reviewSchema = Joi.object({
    review : Joi.object({
        comment:Joi.string().required(),
        rating:Joi.number().required(),
    }).required()
});