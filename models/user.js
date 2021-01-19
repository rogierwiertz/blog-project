const fs = require("fs");
const path = require("path");

const Article = require("./article");
const Comment = require("./comment");

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  about: String,
  profileImage: String,
  socials: {
    facebook: String,
    linkedIn: String,
    twitter: String,
  },
  resetToken: String,
  resetTokenExpiration: Date,
});

userSchema.pre("deleteOne", function (next) {
  /**
   * Delete all articles (including all related comments) from 'user to delete'
   *  */
  const userId = this._conditions._id;

  let hasComments = true;

  // Find all comments from user to delete
  Comment.find({ author: userId })
    .then((userComments) => {
      if (!userComments) {
        throw new Error("There was an error");
      }
      if (userComments.length < 1) {
        // user had no comments
        hasComments = false;
        return;
      }

      // get all articles the user commented
      // get all id's of user comments
      let articleIds = [];
      let commentIds = [];
      userComments.forEach((comment) => {
        articleIds = [...articleIds, comment.article.toString()];
        commentIds = [...commentIds, mongoose.Types.ObjectId(comment._id)];
      });
      articleIds = [...new Set(articleIds)];

      // Pull comment id from array 'comments' from every article the user commented
      return Article.updateMany(
        { _id: { $in: articleIds } },
        { $pull: { comments: { $in: commentIds } } }
      );
    })
    .then((result) => {
      return Article.find({ author: userId }) //find all articles from user to delete
        .populate("comment");
    })
    .then((userArticles) => {
      if (!userArticles) {
        throw new Error("There was an error");
      }
      if (userArticles.length < 1) {
        // user had no articles
        return false;
      }

      // get all comments related to user articles (made by other users)
      // get all the article images related to user
      let commentIds = [];
      let images = [];
      userArticles.forEach((article) => {
        commentIds = [...commentIds, ...article.comments];
        if (article.image) {
          images.push(article.image);
        }
      });

      // Delete all images related to user articles
      images.forEach((image) => {
        const imagePath = path.join(process.cwd(), "public", image);
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.log(err);
          }
        });
      });

      // Delete all coments related to user articles (made by other users)
      return Comment.deleteMany({_id: {$in: commentIds}});
    })
    .then((result) => {
      if (!result) {
        // if user had no articles
        return;
      }

      // Delete all articles from user to delete
      return Article.deleteMany({ author: userId });
    })
    .then((result) => {
      if (hasComments) {
        return Comment.deleteMany({ author: userId });
      }

      return;
    })
    .catch((err) => console.log(err));

  next();
});
module.exports = mongoose.model("user", userSchema);
