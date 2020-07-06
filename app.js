//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

//__________________SESSIONS SET UP___________________//
app.use(
  // THIS NEEDS TO BE ABOVE mongoose.connect AND BELOW ALL THE app.use()
  session({
    secret: "Whats up doc",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize()); // put this below app.use(session)
app.use(passport.session());

//_______MOngoose stuff______________________//
mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose); //used to hash and salt passwords and to save users into DB

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser()); // only necessary when using sessions. wraps up username and password
passport.deserializeUser(User.deserializeUser()); // unwraps username and password so they can be authenticated

//-----------------------------------------------//
//_________________ROUTES_________________________//
app.get("/", (req, res) => {
  res.render("home");
});

app
  .route("/login")
  .get((req, res) => {
    res.render("login");
  })
  .post((req, res) => {
    const newUser = new User({
      username: req.body.username,
      password: req.body.password,
    });
    req.logIn(newUser, (err) => {
      err
        ? console.log(err)
        : passport.authenticate("local")(req, res, () => {
            res.redirect("/secrets");
          });
    }); // from passport
  });

app
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post((req, res) => {
    User.register(
      { username: req.body.username },
      req.body.password,
      (err, user) => {
        if (err) {
          console.log(err);
          res.redirect("/register");
        } else {
          passport.authenticate("local")(req, res, () => {
            res.redirect("/secrets");
          });
        }
      }
    );
  });

app.route("/secrets").get((req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.route("/logout").get((req, res) => {
  req.logOut(); // from passport
  res.redirect("/");
});

app.listen(3000, () => {
  console.log("server started on 3000");
});
