const express = require("express");
const mongoose = require("mongoose");
const app = express();
const jwt = require("jsonwebtoken");
const Product = require("./models/product");
const amqplib = require("amqplib");
const rabbitMQ = "amqp://root:root123@localhost:5672";
const isAuthed = require("../common/auth-middleware");
const connect = async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/product-serivce");
  console.log("Mongoose Connection Success");
};

app.use(express.json());

let connection;
let channel;
async function connectQueue(params) {
  connection = await amqplib.connect(rabbitMQ);
  channel = await connection.createChannel();
  await channel.assertQueue("PRODUCT");
}
connectQueue();
connect();

app.post("/product/create", isAuthed, async (req, res) => {
  const { name, description, price } = req.body;
  const newProduct = new Product({ name, description, price });
  await newProduct.save();
  return res.json(newProduct);
});

app.post("/product/buy", isAuthed, async (req, res) => {
  const { ids } = req.body;
  let order;
  const products = await Product.find({ _id: { $in: ids } });
  await channel.sendToQueue(
    "ORDER",
    Buffer.from(
      JSON.stringify({
        products,
        userEmail: req.user.email,
      })
    )
  );
  await channel.consume("PRODUCT", (data) => {
    order = JSON.parse(data.content);
  });
  return res.json(order);
});

app.listen(7101, () => {
  console.log("Product serivice is running on port 7101");
});
