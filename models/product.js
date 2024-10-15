const mongoose = require("mongoose");
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
