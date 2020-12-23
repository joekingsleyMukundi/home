require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require("mongoose-findorcreate");

app.set("view engene", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/homeDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  username: String,
  fullname: String,
  phone: String,
  role: String,
  password: String,
  googleid: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/home",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.APP_ID,
      clientSecret: process.env.APP_SECRET,
      callbackURL: "http://localhost:3000/auth/facebook/home",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ facebookId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.render("index.ejs");
});
app.post("/", (req, res) => {
  User.register(
    {
      username: req.body.username,
      fullname: req.body.fullname,
      phone: req.body.phone,
      email: req.body.useremail,
      role: req.body.role,
    },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/");
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/home");
        });
      }
    }
  );
});

app.get("/home", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("home.ejs");
  } else {
    res.redirect("/");
  }
});

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, (err) => {
    if (err) {
      console.log(err);
      res.redirect("/");
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/home");
      });
    }
  });
});
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/home",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/home");
  }
);

app.get("/auth/facebook", passport.authenticate("facebook"));

app.get(
  "/auth/facebook/home",
  passport.authenticate("facebook", { failureRedirect: "/" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/home");
  }
);

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

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});
app.listen(port, () => {
  console.log("server is live at port " + port);
});

clientid =
  "39775136496-0ekont6rhvnn7isv10i21ofsbf7bus4v.apps.googleusercontent.com";
clientsecret = "MijPVGfzusEWzNkit1zSdrNz";
