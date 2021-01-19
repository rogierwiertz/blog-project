const path = require("path");
const fs = require("fs");

const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const { prepareError } = require("../utils/errors");

// GET /profile/my-profile
exports.getMyProfile = (req, res, next) => {
  const editMode = req.query.edit === "true" ? true : false;
  let msg = req.flash("error");
  if (msg.length > 0) {
    msg = msg[0];
  } else {
    msg = null;
  }
  if (!mongoose.isValidObjectId(req.session.user._id)) {
    return next(prepareError("There was an error.", 400));
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        throw prepareError("User not found.", 404);
      }
      res.render("profile/my-profile.ejs", {
        title: "My Profile",
        path: "/profile/my-profile",
        flashMessage: msg,
        user: user,
        editMode: editMode,
      });
    })
    .catch((err) => next(err));
};

// POST /profile/update-profile
exports.postUpdateProfile = (req, res, next) => {
  const userId = req.session.user._id;

  if (!mongoose.isValidObjectId(userId)) {
    throw prepareError("There was an error.", 400);
  }

  // user input
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const about = req.body.about;
  const facebookURL = req.body.facebook;
  const linkedInURL = req.body.linkedIn;
  const twitterURL = req.body.twitter;

  // user input validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash("error", errors.array()[0].msg);
    return res.redirect("/profile/my-profile?edit=true");
  }

  User.updateOne(
    { _id: userId },
    {
      firstName,
      lastName,
      email,
      about,
      socials: {
        facebook: facebookURL,
        linkedIn: linkedInURL,
        twitter: twitterURL,
      },
    }
  )
    .then((result) => {
      if (!result || result.n === 0) {
        req.flash("error", "There was an error. Please try again.");
      }
      res.redirect("/profile/my-profile");
    })
    .catch((err) => {
      next(err);
    });
};

// POST /upload-image
exports.postUploadImage = (req, res, next) => {
  const userId = req.session.user._id;
  if (!mongoose.isValidObjectId(userId)) {
    throw prepareError("There was an error.", 400);
  }

  if (!req.file) {
    req.flash("error", "Please select an image.");
    return res.redirect("/profile/my-profile");
  }

  User.findById(userId)
    .then((user) => {
      if (!user) {
        throw prepareError("User not found.", 400);
      }
      // getting old image
      const oldImage =
        user.profileImage !== "/img/no-profile-image.jpg"
          ? path.join(process.cwd(), "public", user.profileImage)
          : null;
      // updating image
      user.profileImage = "/uploads/" + req.file.filename;
      user.save().then((result) => {
        if (!result) {
          throw prepareError("There was an error.", 500);
        }
        if (oldImage) {
          fs.unlink(oldImage, (err) => {
            console.log(err);
          });
        }
        res.redirect("/profile/my-profile");
      });
    })
    .catch((err) => next(err));
};

// POST /delete-image
exports.postDeleteImage = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.session.user._id)) {
    throw prepareError("There was an error.", 500);
  }

  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        throw prepareError("User not found.", 400);
      }
      if (
        !user.profileImage ||
        user.profileImage === "/img/no-profile-image.jpg"
      ) {
        req.flash("error", "No image to delete.");
        return res.redirect("/profile/my-profile");
      }
      const oldImage = path.join(process.cwd(), "public", user.profileImage);
      fs.unlink(oldImage, (err) => {
        if (err) {
          console.log(err);
        }
      });

      user.profileImage = "/img/no-profile-image.jpg";
      user.save().then((result) => {
        req.flash("error", "Image was deleted.");
        return res.redirect("/profile/my-profile");
      });
    })
    .catch((err) => next(err));
};

// GET /profile/change-password
exports.getChangePassword = (req, res, next) => {
  const userId = req.session.user._id;
  if (!mongoose.isValidObjectId(userId)) {
    throw prepareError("There was an error.", 400);
  }

  let msg = req.flash("error");
  if (msg.length > 0) {
    msg = msg[0];
  } else {
    msg = null;
  }

  User.findById(userId)
    .then((user) => {
      if (!user) {
        throw prepareError("User not found.", 400);
      }
      res.render("profile/change-password.ejs", {
        title: "My Profile",
        path: "/my-profile",
        flashMessage: msg,
        user: user,
      });
    })
    .catch((err) => next(err));
};

// POST /profile/change-password
exports.postChangePassword = (req, res, next) => {
  const userId = req.session.user._id;
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.password;

  if (!mongoose.isValidObjectId(userId)) {
    throw prepareError("There was an error.", 400);
  }

  // user input validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash("error", errors.array()[0].msg);
    return res.redirect("/profile/change-password");
  }

  // authorisation
  User.findById(userId)
    .then((user) => {
      if (!user) {
        throw prepareError("User not found.", 400);
      }
      if (!bcrypt.compareSync(oldPassword, user.password)) {
        req.flash("error", "Old password is incorrect.");
        return res.redirect("/login");
      }
      const hashedPassword = bcrypt.hashSync(newPassword, 12);
      user.password = hashedPassword;
      user.save().then((result) => {
        if (!result) {
          throw prepareError("There was an error.", 500);
        }
        req.flash("error", "Password changed.");
        res.redirect("/profile/my-profile");
      });
    })
    .catch((err) => next(err));
};

// GET /profile/delete-account
exports.getDeleteAccount = (req, res) => {
  let msg = req.flash("error");
  if (msg.length > 0) {
    msg = msg[0];
  } else {
    msg = null;
  }
  res.render("profile/delete-account.ejs", {
    title: "Delete account",
    path: "/delete-account",
    flashMessage: msg,
  });
};

// POST /delete-account
exports.postDeleteAccount = (req, res, next) => {
  const userId = req.session.user._id;
  const password = req.body.password;

  if (!mongoose.isValidObjectId(userId)) {
    throw prepareError("There was an error.", 400);
  }

  // user input validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash("error", errors.array()[0].msg);
    return res.redirect("/profile/delete-account");
  }

  // find the user
  User.findOne({ _id: userId })
    .then((userToDelete) => {
      if (!userToDelete) {
        throw prepareError("There was an error.", 500);
      }

      // check if password matches
      const passwordMatch = bcrypt.compareSync(password, userToDelete.password);

      if (!passwordMatch) {
        req.flash("error", "Incorrect password");
        return res.redirect("/profile/delete-account");
      }

      // delete user 
      User.deleteOne({ _id: userToDelete._id }).then((result) => {
        if (!result) {
          throw prepareError("There was an error.", 500);
        } else {
          return res.redirect("/logout");
        }
      });
    })
    .catch((err) => next(err));
};
