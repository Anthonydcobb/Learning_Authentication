//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const md5 = require("md5"); // hash function
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

//_______MOngoose stuff______________________//
mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

//-----------------------------------------------//

app.get("/", (req, res) => {
  res.render("home");
});

app
  .route("/login")
  .get((req, res) => {
    res.render("login");
  })
  .post((req, res) => {
    User.findOne({ username: req.body.username }, (err, foundUser) => {
      if (err) {
        console.log("try again");
        res.redirect("/login");
      } else {
        if (foundUser) {
          bcrypt.compare(
            req.body.password,
            foundUser.password,
            (err, result) => {
              if (result === true) {
                res.render("secrets");
              }
            }
          );
        }
      }
    });
  });

app
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post((req, res) => {
    User.findOne({ username: req.body.username }, (err, result) => {
      if (result === null) {
        bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
          const newUser = new User({
            username: req.body.username,
            password: hash,
          });
          newUser.save(() => {
            err ? console.log(err) : res.redirect("/login");
          });
        });
      } else {
        console.log("Username already exists");
        res.redirect("/register");
      }
    });
  });

app.listen(3000, () => {
  console.log("server started on 3000");
});
