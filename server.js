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
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./upload/");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString() + file.originalname);
  },
});

const upload = multer({ storage: storage });

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
  profileimg: String,
  googleId: String,
  facebookId: String,
  houseId: [String],
});
const houseSchema = new mongoose.Schema({
  ownerId: String,
  ownername: String,
  ownerphone: String,
  ownerdp: String,
  renterId: String,
  title: String,
  status: String,
  city: String,
  price: String,
  paymentStatus: String,
  reviews: [
    {
      name: String,
      comments: String,
      rating: String,
    },
  ],
  rooms: String,
  births: String,
  area: String,
  areacode: String,
  address: String,
  type: String,
  renters: String,
  housedp: String,
  housepics: [String],
  speciality: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
const House = new mongoose.model("House", houseSchema);

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
      User.findOrCreate(
        { googleId: profile.id, username: profile.displayName },
        function (err, user) {
          return cb(err, user);
        }
      );
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
      User.findOrCreate(
        { facebookId: profile.id, username: profile.displayName },
        function (err, user) {
          return cb(err, user);
        }
      );
    }
  )
);

app.use("/upload", express.static("upload"));

app.get("/", (req, res) => {
  res.render("index.ejs");
});
app.post("/", upload.single("profileimg"), (req, res) => {
  console.log(req.file);
  User.register(
    {
      username: req.body.username,
      fullname: req.body.fullname,
      phone: req.body.phone,
      email: req.body.useremail,
      role: req.body.role,
      profileimg: req.file.path,
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
    User.findById({ _id: req.user.id }, (err, foundusers) => {
      if (err) {
        console.log(err);
      } else {
        if (foundusers) {
          House.find({}, (err, foundhouses) => {
            if (foundhouses.length != 0) {
              console.log(foundhouses);
              const username = foundusers.username;
              const profileDp = foundusers.profileimg;
              const role = foundusers.role;
              res.render("home.ejs", {
                Housedbstatus: foundhouses.length,
                userdisplayname: username,
                profileimage: profileDp,
                userRole: role,
                houses: foundhouses,
                // houseImage: foundhouse.housedp,
                // prices: foundhouse.price,
                // listerimage: foundowner.profileimg,
                // housetitle: foundhouse.title,
                // address: foundhouse.price,
                // area: foundhouse.area,
                // city: foundhouse.area,
                // housenumber: foundhouse.address,
                // rooms: foundhouse.rooms,
                // births: foundhouse.births,
                // renters: foundhouse.renters,
                // type: foundhouse.type,
                // listername: foundowner.fullname,
              });
            } else if (foundhouses.length == 0) {
              console.log("no houses");
              console.log("user" + req.user);
              const username = foundusers.username;
              const profileDp = foundusers.profileimg;
              const role = foundusers.role;
              res.render("home.ejs", {
                Housedbstatus: foundhouses.length,
                userdisplayname: username,
                profileimage: profileDp,
                userRole: role,
              });
            }
          });
        }
      }
    });
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
  if (req.isAuthenticated()) {
    User.findById({ _id: req.user.id }, (err, foundusers) => {
      if (err) {
        console.log(err);
      } else {
        if (foundusers) {
          console.log(foundusers);
          const username = foundusers.username;
          const profileDp = foundusers.profileimg;
          const role = foundusers.role;
          res.render("listing.ejs", {
            userdisplayname: username,
            profileimage: profileDp,
            userRole: role,
          });
        }
      }
    });
  } else {
    res.redirect("/");
  }
});
app.get("/Appartment", (req, res) => {
  if (req.isAuthenticated()) {
    User.findById({ _id: req.user.id }, (err, foundusers) => {
      if (err) {
        console.log(err);
      } else {
        if (foundusers) {
          console.log(foundusers);
          const username = foundusers.username;
          const profileDp = foundusers.profileimg;
          const role = foundusers.role;
          res.render("Appartment.ejs", {
            userdisplayname: username,
            profileimage: profileDp,
            userRole: role,
          });
        }
      }
    });
  } else {
    res.redirect("/");
  }
});
app.get("/bed-breakfast", (req, res) => {
  if (req.isAuthenticated()) {
    User.findById({ _id: req.user.id }, (err, foundusers) => {
      if (err) {
        console.log(err);
      } else {
        if (foundusers) {
          console.log(foundusers);
          const username = foundusers.username;
          const profileDp = foundusers.profileimg;
          const role = foundusers.role;
          res.render("bed-breakfast.ejs", {
            userdisplayname: username,
            profileimage: profileDp,
            userRole: role,
          });
        }
      }
    });
  } else {
    res.redirect("/");
  }
});
app.get("/condo", (req, res) => {
  if (req.isAuthenticated()) {
    User.findById({ _id: req.user.id }, (err, foundusers) => {
      if (err) {
        console.log(err);
      } else {
        if (foundusers) {
          console.log(foundusers);
          const username = foundusers.username;
          const profileDp = foundusers.profileimg;
          const role = foundusers.role;
          res.render("condo.ejs", {
            userdisplayname: username,
            profileimage: profileDp,
            userRole: role,
          });
        }
      }
    });
  } else {
    res.redirect("/");
  }
});
app.get("/house", (req, res) => {
  if (req.isAuthenticated()) {
    User.findById({ _id: req.user.id }, (err, foundusers) => {
      if (err) {
        console.log(err);
      } else {
        if (foundusers) {
          console.log(foundusers);
          const username = foundusers.username;
          const profileDp = foundusers.profileimg;
          const role = foundusers.role;
          res.render("house.ejs", {
            userdisplayname: username,
            profileimage: profileDp,
            userRole: role,
          });
        }
      }
    });
  } else {
    res.redirect("/");
  }
});
app.get("/studio", (req, res) => {
  if (req.isAuthenticated()) {
    User.findById({ _id: req.user.id }, (err, foundusers) => {
      if (err) {
        console.log(err);
      } else {
        if (foundusers) {
          console.log(foundusers);
          const username = foundusers.username;
          const profileDp = foundusers.profileimg;
          const role = foundusers.role;
          res.render("studio.ejs", {
            userdisplayname: username,
            profileimage: profileDp,
            userRole: role,
          });
        }
      }
    });
  } else {
    res.redirect("/");
  }
});
app.get("/loft", (req, res) => {
  if (req.isAuthenticated()) {
    User.findById({ _id: req.user.id }, (err, foundusers) => {
      if (err) {
        console.log(err);
      } else {
        if (foundusers) {
          console.log(foundusers);
          const username = foundusers.username;
          const profileDp = foundusers.profileimg;
          const role = foundusers.role;
          res.render("studio.ejs", {
            userdisplayname: username,
            profileimage: profileDp,
            userRole: role,
          });
        }
      }
    });
  } else {
    res.redirect("/");
  }
});
app.get("/blog", (req, res) => {
  if (req.isAuthenticated()) {
    User.findById({ _id: req.user.id }, (err, foundusers) => {
      if (err) {
        console.log(err);
      } else {
        if (foundusers) {
          console.log(foundusers);
          const username = foundusers.username;
          const profileDp = foundusers.profileimg;
          const role = foundusers.role;
          res.render("blog.ejs", {
            userdisplayname: username,
            profileimage: profileDp,
            userRole: role,
          });
        }
      }
    });
  } else {
    res.redirect("/");
  }
});
app.get("/host-registration", (req, res) => {
  if (req.isAuthenticated()) {
    User.findById({ _id: req.user.id }, (err, foundusers) => {
      if (err) {
        console.log(err);
      } else {
        if (foundusers) {
          console.log(foundusers);
          const username = foundusers.username;
          const profileDp = foundusers.profileimg;
          const role = foundusers.role;
          res.render("hostreg.ejs", {
            userdisplayname: username,
            profileimage: profileDp,
            userRole: role,
          });
        }
      }
    });
  } else {
    res.redirect("/");
  }
});

app.post("/host-registration", (req, res) => {
  User.updateOne({ _id: req.user.id }, { role: "homey_host" }, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("success");
      res.redirect("/home");
    }
  });
});

app.get("/lisingproperty", (req, res) => {
  if (req.isAuthenticated()) {
    User.findById({ _id: req.user.id }, (err, foundusers) => {
      if (err) {
        console.log(err);
      } else {
        if (foundusers) {
          console.log(foundusers);
          const username = foundusers.username;
          const profileDp = foundusers.profileimg;
          const role = foundusers.role;
          res.render("propertylisting.ejs", {
            userdisplayname: username,
            profileimage: profileDp,
            userRole: role,
          });
        }
      }
    });
  } else {
    res.redirect("/");
  }
});

app.post("/lisingproperty", upload.single("houseDp"), (req, res) => {
  const houselisting = new House({
    ownerId: req.user.id,
    ownername: req.user.fullname,
    ownerphone: req.user.phone,
    ownerdp: req.user.profileimg,
    title: req.body.title,
    price: req.body.price,
    rooms: req.body.rooms,
    city: req.body.city,
    area: req.body.area,
    areacode: req.body.code,
    births: req.body.births,
    address: req.body.address,
    type: req.body.houseType,
    renters: req.body.population,
    housedp: req.file.path,
  });
  houselisting.save((err) => {
    if (err) {
      console.log("error in  saving is" + err);
      res.redirect("/lisingproperty");
    } else {
      House.find({ ownerId: req.user.id }, (err, foundhouses) => {
        if (err) {
          console.log("error in finding owner id is " + err);
        } else {
          User.findById({ _id: req.user.id }, (err, founduser) => {
            if (err) {
              console.log(
                "the err in looking through the user to find the lister od a plot so ass to ensure no repetition in the house id arry is " +
                  err
              );
            } else {
              const housearry = founduser.houseId;
              console.log(foundhouses._id);
              console.log(foundhouses);
              foundhouses.forEach((foundhouse) => {
                if (housearry.includes(foundhouse._id)) {
                  console.log("error house already exists");
                  console.log(foundhouses._id);
                } else {
                  User.updateOne(
                    { _id: req.user.id },
                    { $push: { houseId: foundhouse._id } },
                    (err) => {
                      if (err) {
                        console.log("the error in updating house id is " + err);
                      } else {
                        console.log("success");
                        res.redirect("/home");
                      }
                    }
                  );
                }
              });
            }
          });
        }
      });
    }
  });
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("server is live at port " + port);
});
