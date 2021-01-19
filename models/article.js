const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Comment = require("./comment");
const Article = require("./article");
const fs = require("fs");

const articleSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    image: String,
    public: {
      type: Boolean,
      required: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "comment",
      },
    ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    ],
  },
  { timestamps: {} }
);

articleSchema.pre("deleteOne", function (next) {
  /**
   * Delete all related comments when an article gets deleted.
   */
  const articleId = this._conditions._id;

  Comment.deleteMany({ article: articleId }).catch((err) => console.log(err));

  next();
});

module.exports = mongoose.model("article", articleSchema);
