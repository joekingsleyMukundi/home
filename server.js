require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
// const session = require("express-session");
// const passport = require("passport");
// const passportLocalMongoose = require("passport-local-mongoose");

app.set("view engene", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// app.use(
//   session({
//     secret: "Our little secret.",
//     resave: false,
//     saveUninitialized: false,
//   })
// );

// app.use(passport.initialize());
// app.use(passport.session());

// mongoose.connect('mongodb://localhost:27017/homeDB',{useNewUrlParser: true});
// mongoose.set("useCreateIndex", true);

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.render("index.ejs");
});
app.post("/", (req, res) => {
  console.log(req.body.username);
  res.redirect("/home");
});
app.get("/home", (req, res) => {
  res.render("home.ejs");
});
app.get("/listing", (req, res) => {
  res.render("listing.ejs");
});
app.get("/Appartment", (req, res) => {
  res.render("Appartment.ejs");
});
app.get("/bed-breakfast", (req, res) => {
  res.render("bed-breakfast.ejs");
});
app.get("/condo", (req, res) => {
  res.render("condo.ejs");
});
app.get("/house", (req, res) => {
  res.render("house.ejs");
});
app.get("/studio", (req, res) => {
  res.render("studio.ejs");
});
app.get("/loft", (req, res) => {
  res.render("loft.ejs");
});
app.get("/blog", (req, res) => {
  res.render("blog.ejs");
});
app.get("/host-registration", (req, res) => {
  res.render("hostreg.ejs");
});

app.listen(port, () => {
  console.log("server is live at port " + port);
});
