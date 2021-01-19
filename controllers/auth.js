const crypto = require("crypto");

const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const { prepareError } = require("../utils/errors");
const mail = require("@sendgrid/mail");
const mongoose = require('mongoose');
mail.setApiKey(
  process.env.MAIL_API_KEY
);

// GET /login
exports.getLogin = (req, res) => {
  let msg = req.flash("error");
  if (msg.length > 0) {
    msg = msg[0];
  } else {
    msg = null;
  }
  let email = req.flash("email");
  if (email.length > 0) {
    email = email[0];
  } else {
    email = null;
  }

  res.render("auth/login.ejs", {
    title: "Login page",
    path: "/login",
    data: {
      email: email,
    },
    flashMessage: msg,
  });
};

// POST /login
exports.postLogin = (req, res, next) => {
  // user input
  const email = req.body.email;
  const password = req.body.password;
  const rememberMe = req.body.remember === "on" ? true : false;

  //validation of user input
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.flash("error", errors.array()[0].msg);
    req.flash("email", email);
    res.redirect("/login");
    return;
  }
  
  // authorisation
  User.findOne({ email: email })
    .then((user) => {
      if (!user || !bcrypt.compareSync(password, user.password)) {
        req.flash("error", "Wrong email or password.");
        req.flash("email", email);
        res.redirect("/login");
      } else {
        if(rememberMe) {
          req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 7;
        }        
        req.session.isLoggedIn = true;
        req.session.user = {};
        req.session.user._id = user._id;
        req.session.user.name = user.firstName + " " + user.lastName;
        req.session.save((err) => {
          if (err) {
            console.log(err);
          }
          res.redirect("/");
        });
      }
    })
    .catch((err) => next(err));
};
// GET /logout
exports.getLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    }
    res.redirect("/");
  });
};

// GET /signup
exports.getSignup = (req, res) => {
  let msg = req.flash("error");
  if (msg.length > 0) {
    msg = msg[0];
  } else {
    msg = null;
  }
  let userInput = req.flash("data");
  
  if (userInput.length > 0) {
    userInput = {
      firstName: userInput[0],
      lastName: userInput[1],
      email: userInput[2],
    };
  } else {
    userInput = null;
  }

  res.render("auth/signup.ejs", {
    title: "Signup page",
    path: "/signup",
    data: userInput,
    flashMessage: msg,
  });
};

// POST /signup
exports.postSignup = (req, res, next) => {
  // user input
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const password = req.body.password;
  const stdProfileImage = "/img/no-profile-image.jpg";

  //validation of user input
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.flash("error", errors.array()[0].msg);    
    req.flash("data", [firstName, lastName, email]);    
    res.redirect("/signup");
    return;
  }

  // registration process
  User.findOne({ email: email })
    .then((user) => {
      if (user) {
        req.flash("error", "Email already taken.");
        req.flash("data", firstName);
        req.flash("data", lastName);
        req.flash("data", email);
        res.redirect("/signup");
        return;
      } else {
        const hashedPassword = bcrypt.hashSync(password, 12);
        const user = new User({
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: hashedPassword,
          profileImage: stdProfileImage,
        });
        return user.save().then((user) => {
          req.session.isLoggedIn = true;
          req.session.user = {};
          req.session.user._id = user._id;
          req.session.user.name = user.firstName + " " + user.lastName;
          req.session.save((err) => {
            if (err) {
              console.log(err);
            }
            res.redirect("/");
          });
        });
      }
    })
    .catch((err) => next(err));
};

// GET /forgot-password
exports.getForgotPassword = (req, res) => {
  let msg = req.flash("error");
  if (msg.length > 0) {
    msg = msg[0];
  } else {
    msg = null;
  }
  let email = req.flash("email");
  if (email.length > 0) {
    email = email[0];
  } else {
    email = null;
  }

  res.render("auth/forgot-password.ejs", {
    title: "Forgot Password",
    path: "/forgot-password",
    flashMessage: msg,
    data: {
      email: email,
    },
  });
};

// POST /forgot-password
exports.postForgotPassword = (req, res, next) => {
  // user input
  const email = req.body.email;
  if (!email) {
    req.flash("error", "Please enter your email.");
    return res.redirect("/forgot-password");
  }
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return res.redirect("/forgot-password");
    }
    const token = buffer.toString("hex");

    User.findOne({ email: email })
      .then((user) => {
        if (!user) {
          req.flash("error", "Email not found.");
          req.flash("email", email);
          return res.redirect("/forgot-password");
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 1000 * 60 * 60;
        return user.save().then((result) => {
          req.flash("error", "You recieved an email with a reset link.");
          res.redirect("/login");
        });
      })
      .catch((err) => next(err));

    mail.send({
      from: process.env.EMAIL_FROM,
      to: req.body.email,
      subject: "Reset your password",
      html: `
            <h1>Blog Project</h1>
            <p>You requested a password reset.</p>
            <p>Click <a href="http://localhost:3000/reset-password/${token}">this link</a> to reset your password.</p>
            <p style="color: red">Link will expire in one hour.</p>`,
    });
  });
};

// GET /reset-password/:token
exports.getResetPassword = (req, res, next) => {
  const token = req.params.token;

  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      if (!user) {
        req.flash("error", "Invalid token. Please request a new one.");
        return res.redirect("/forgot-password");
      }
      let msg = req.flash("error");
      if (msg.length > 0) {
        msg = msg[0];
      } else {
        msg = null;
      }
      res.render("auth/update-password.ejs", {
        title: "Reset Password",
        path: "/update-password",
        flashMessage: msg,
        passwordToken: token,
        userId: user ? user._id.toString() : null,
      });
    })
    .catch((err) => next(err));
};

// POST /reset-password/:token
exports.postResetPassword = (req, res, next) => {
  // user inpput
  const token = req.body.passwordToken;
  const userId =req.body.userId;
  
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  if(!mongoose.isValidObjectId(userId)) {
    throw prepareError('There was an error. Please try again.', 500);
  }
  //validation of user input
  if (!password || !confirmPassword) {
    req.flash("error", "All fields are required.");
    res.redirect(`/reset-password/${token}`);
    return;
  } else if (password !== confirmPassword) {
    req.flash("error", "Passwords don't match.");
    res.redirect(`/reset-password/${token}`);
    return;
  }
  let updatedUser;
  User.findOne({
    _id: userId,
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      if(!user) {
        throw prepareError('User not found.', 500);
      }
      updatedUser = user;
      return bcrypt.hash(password, 12);
    })
    .then((hashedPassword) => {
      updatedUser.password = hashedPassword;
      updatedUser.resetToken = undefined;
      updatedUser.resetTokenExpiration = undefined;
      return updatedUser.save();
    })
    .then((result) => {
      if(!result) {
        throw prepareError('There was an error.', 500);
      }
      req.flash(
        "error",
        "Your password was succesfully updated. You can now log in."
      );
      res.redirect("/login");
    })
    .catch((err) => next(err));
};
