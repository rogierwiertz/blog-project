const path = require('path');
const fs = require('fs');
const Article = require("../models/article");
const Comment = require("../models/comment");
const {prepareError} = require("../utils/errors");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const ITEMS_PER_PAGE = 6;

// GET /
exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalArticles;
  Article.find({ publishedAt: { $ne: null } })
    .countDocuments()
    .then((numOfDocuments) => {
      totalArticles = numOfDocuments;
      return Article.find({ publishedAt: { $ne: null } })
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        .populate("author")
        .sort({ publishedAt: "descending"});
    })
    .then((articles) => {
      res.render("index.ejs", {
        title: "Blog Project",
        path: "/",
        articles: articles,
        currentPage: page,
        hasPreviousPage: page > 1,
        hasNextPage: page * ITEMS_PER_PAGE < totalArticles,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalArticles / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      next(err)
    });
};

// GET /article/:postId
exports.getArticle = (req, res, next) => {
  const articleId = req.params.id;

  if (!mongoose.isValidObjectId(articleId)) {
    throw prepareError('Not a valid article Id', 400);
  }

  let msg = req.flash("error");
  if (msg.length > 0) {
    msg = msg[0];
  } else {
    msg = null;
  }
  let userInput = req.flash("post");

  // find article and check if published

  Article.findOne({ _id: articleId, publishedAt: { $ne: null } })
    .populate("author", '-password')
    .then((article) => {
      if (!article) {
        throw prepareError('Article doesn\'t exist or is unpublished.', 404)
      }
      res.render("article.ejs", {
        title: article.title,
        path: null,
        article: article,
        flashMessage: msg,
        data: {
          comment: userInput,
        },
        public: true
      });
    })
    .catch((err) => next(err));
};

// GET /blog/my-articles
exports.getMyArticles = (req, res, next) => {
  const userId = req.session.user._id;  

  if (!mongoose.isValidObjectId(userId)) {
    throw prepareError('Not a valid user Id.', 400);
  }

  Article.find({ author: userId })
    .then((articles) => {
      res.render("blog/my-articles.ejs", {
        title: "My Articles",
        path: "/blog/my-articles",
        articles: articles,
      });
    })
    .catch((err) => next(err));
};

// GET /blog/my-articles/:id
exports.getMyArticle = (req, res, next) => {
  const articleId = req.params.id;

  // check for valid objectId
  if (!mongoose.isValidObjectId(articleId)) {
    throw prepareError('Not a valid article Id.', 400);
  }
  // find article
  Article.findOne({ _id: articleId })
    .populate("author", '-password')
    .populate({
      path: "comments",
      populate: {
        path: "author",
        select: ['firstName', 'lastName', 'profileImage', '_id']
      },
    })
    .then((article) => {
      if (!article) {
        throw prepareError('No article found.', 404);
      }
      
      res.render("article.ejs", {
        title: article.title,
        path: null,
        article: article,
        flashMessage: null,
        data: {
          message: null,
        },
        public: false
      });
    })
    .catch((err) => next(err));
};

// GET /blog/new-article
exports.getNewArticle = (req, res, next) => {
  let msg = req.flash("error");
  if (msg.length > 0) {
    msg = msg[0];
  } else {
    msg = null;
  }
  let userInput = req.flash("post");
  if (userInput.length > 0) {
    userInput.title = userInput[0].title;
    userInput.description = userInput[0].description;
    userInput.content = userInput[0].content;
    userInput.public = userInput[0].public;
  } else {
    userInput = { title: null, content: null, public: null };
  }

  res.render("blog/new-article.ejs", {
    title: "Add new article",
    path: "/blog/new-article",
    userInput: userInput,
    flashMessage: msg,
  });
};
// POST /blog/new-article
exports.postNewArticle = (req, res, next) => {
  const title = req.body.title;
  const description = req.body.description;
  const image = req.file ? "/uploads/" + req.file.filename : null;
  const content = req.body.content;
  const public = req.body.published ? true : false;
  const user = req.session.user._id;

  if(!mongoose.isValidObjectId(user)) {
    throw prepareError('Not a valid user Id.', 400);
  }

  //validation of user input
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.flash("error", errors.array()[0].msg);
    req.flash("post", { title, description, content, public });
    res.redirect("/blog/new-article");
    return;
  }

  const article = new Article({
    title,
    description,
    image,
    content,
    public,
    author: user,
  });
  if (public) {
    article.publishedAt = Date.now();
  }
  article
    .save()
    .then((article) => {      
      res.redirect("/blog/my-articles");
    })
    .catch((err) => next(err));
};

// GET /blog/update-article/:id
exports.getUpdateArticle = (req, res, next) => {
  const articleId = req.params.id;
  const userId = req.session.user._id;

  if(!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(articleId)) {
    throw prepareError('Not a valid user Id or article Id.', 400);
  }

  let msg = req.flash("error");
  if (msg.length > 0) {
    msg = msg[0];
  } else {
    msg = null;
  }

  Article.findOne({ _id: articleId, author: userId })
    .then((article) => {
      if (!article) {
        throw prepareError('Article not found.', 404);
      }
      let userInput = req.flash("post");
      if (userInput.length > 0) {
        article.title = userInput[0].title;
        article.description = userInput[0].description;
        article.content = userInput[0].content;
        article.public = userInput[0].public;
      }
      res.render("blog/update-article.ejs", {
        title: "Update article",
        path: "/blog/update-article",
        article: article,
        flashMessage: msg,
      });
    })
    .catch((err) => next(err));
};

// POST /blog/update-article
exports.postUpdateArticle = (req, res, next) => {
  const articleId = req.body.id;
  const userId = req.session.user._id;

  if(!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(articleId)) {
    throw prepareError('Not a valid user Id or article Id.', 400);
  }

  const title = req.body.title;
  const description = req.body.description;
  const image = req.file ? "/uploads/" + req.file.filename : null;
  const content = req.body.content;
  const public = req.body.published ? true : false;


  //user input validation
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.flash("error", errors.array()[0].msg);
    req.flash("post", { title, description, content, public });
    res.redirect(`/blog/update-post/${articleId}`);
    return;
  }

  Article.findOne({ _id: articleId, author: userId })
    .then((article) => {
      if (!article) {
        throw prepareError('Article not found.', 404);
      }
      article.title = title;
      article.description = description;
      article.content = content;
      public
        ? (article.publishedAt = Date.now())
        : (article.publishedAt = null);
      if (image) {
        article.image = "/uploads/" + req.file.filename;
      }

      return article.save();
    })
    .then((updatedPost) => {
      res.redirect("/blog/my-articles");
    })
    .catch((err) => next(err));
};

// PATCH /blog/publish-article
// JSON response
exports.patchPublishArticle = (req, res, next) => {
  const articleId = req.body.id;
  const userId = req.session.user._id;

  if (!mongoose.isValidObjectId(articleId) || !mongoose.isValidObjectId(userId)) {
    throw prepareError('There was an error. Article not published', 400, 'json');
  }

  Article.findOne({ _id: articleId, author: userId })
    .then((article) => {
      if (!article) {
        throw prepareError('Article not found.', 404, 'json');
      }
      article.publishedAt = Date.now();
      return article.save();
    })
    .then((result) => {
      return res
        .status(200)
        .json({ message: "Article is published successfully." });
    })
    .catch((err) => {
      next(err);
    });
};

// PATCH /blog/unpublish-article
// JSON response
exports.patchUnpublishArticle = (req, res, next) => {
  const articleId = req.body.id;
  const userId = req.session.user._id;

  if (!mongoose.isValidObjectId(articleId) || !mongoose.isValidObjectId(userId)) {
    throw prepareError('There was an error. Article not unpublished.', 400, 'json');
  }

  Article.findOne({ _id: articleId, author: userId })
    .then((article) => {
      if (!article) {
        throw prepareError('Article not found.', 404, 'json');   
      }
      article.publishedAt = null;
      return article.save();
    })
    .then((result) => {
      return res
        .status(200)
        .json({ message: "Article is unpublished successfully." });
    })
    .catch((err) => {
      next(err);
    });
};

// POST /blog/delete-article/:id
// JSON response
exports.deleteArticle = (req, res, next) => {
  const articleId = req.params.id;
  const userId = req.session.user._id;

  // check if articleId & authorId are valid ObjectIds, otherwise return res.redirect
  if (
    !mongoose.isValidObjectId(articleId) ||
    !mongoose.isValidObjectId(userId)
  ) {
    throw prepareError('There was an error. Article not deleted.', 400, 'json');
  }

  Article.findOneAndDelete({ _id: articleId, author: userId })
    .then((article) => {
        
      if (!article) {
        throw prepareError('Article not found.', 404, 'json');  
      }
      if (!article.image) {
        return;
      }

    // Delete article image
      const image = path.join(process.cwd(), "public", article.image);
      return fs.unlink(image, (err) => {
        if (err) {
            console.log("Could not delete article image");
        }
      });
    })
    .then((result) => {
      return res.status(200).json({ message: "Article deleted successfully." });
    })
    .catch((err) => next(err));  
};

// POST /article/add-comment
// JSON response
exports.postAddComment = (req, res, next) => {
  const message = req.body.message;
  const articleId = req.body.article;
  const authorId = req.body.author;

  if (
    !mongoose.isValidObjectId(articleId) ||
    !mongoose.isValidObjectId(authorId)
  ) {
    throw prepareError('There was an error. Comment not added.', 400, 'json');
  }

  //user input validation
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw prepareError(errors.array()[0].msg, 400, 'json');
  }

  const comment = new Comment({
    content: message,
    author: authorId,
    article: articleId,
  });
  let commentId;

  comment
    .save()
    .then((result) => {
      commentId = result._id;
      return Article.findOne({ _id: articleId });
    })
    .then((article) => {
      if(!article) {
        throw prepareError('Article not found.', 404, 'json');
      }
      article.comments.push(mongoose.Types.ObjectId(commentId));
      return article.save();
    })
    .then((articleWithComment) => {
      Comment.findOne({ _id: commentId })
        .populate("author", ["firstName", "lastName", "profileImage"])
        .then((comment) => {
          if(!comment) {
            throw prepareError('Comment not found.', 404, 'json');
          }
          return res.status(201).json({
            message: "Comment added",
            _id: comment._id,
            firstName: comment.author.firstName,
            lastName: comment.author.lastName,
            profileImage: comment.author.profileImage,
            content: comment.content,
          });
        });
    })
    .catch((err) => next(err));
};

// GET /article/get-comments
// JSON response
exports.getComments = (req, res, next) => {
  const articleId = req.query.article;
  const offset = +req.query.offset || 0;
  const limit = +req.query.limit;

  const userId = req.session.user ? req.session.user._id : null;

  if (!mongoose.isValidObjectId(articleId) || offset === undefined ) {
    throw prepareError('There was an error loading the comments for this article.', 400, 'json');
  }

  Comment.find({ article: articleId })
    .skip(offset)
    .limit(limit)
    .populate("author", ['firstName', 'lastName', 'profileImage'])
    .sort({ createdAt: "descending" })
    .then((comments) => {
      res.status(200).json({
        comments,
        userId,
      });
    })
    .catch((err) => next(err));
};

// DELETE /article/delete-comment
// JSON response
exports.deleteDeleteComment = (req, res, next) => {
  const commentId = req.query.id;
  const articleId = req.query.article;
  const authorId = req.session.user._id;
  
  if (!mongoose.isValidObjectId(commentId) || !mongoose.isValidObjectId(authorId) || !mongoose.isValidObjectId(articleId)) {
    throw prepareError('There was an error. Comment not deleted.', 400, 'json');
  }
  
  Article.findOne({ _id: articleId })
    .then((article) => {
      if (!article) {
        throw prepareError('Article not found.', 404, 'json');
      }
      article.comments = article.comments.filter(
        (comment) => comment.toString() !== commentId.toString()
      );
      return article.save();
    })
    .then((result) => {
      if (!result) {
        throw prepareError('There was an error.', 500, 'json');
      }
      return Comment.deleteOne({ _id: commentId, author: authorId });
    })
    .then((comment) => {
      if (comment.deletedCount === 0) {
        throw prepareError('There was an error. Comment not deleted.', 500, 'json');
      }
      res.status(200).json({
        message: "Comment deleted",
      });
    })
    .catch((err) => next(err));
};

// PATCH /article/like-article
// JSON respomse
exports.patchLikeArticle = (req, res, next) => {
  const userId = req.session.user._id;
  const articleId = req.body.articleId;

  if(!mongoose.isValidObjectId(articleId) || !mongoose.isValidObjectId(userId)) {
    throw prepareError('There was an error. Please try again.', 400, 'json');
  }

  let state;
  let numOflikes;

  Article.findById(articleId)
  .then(article => {
    if(!article) {
      throw prepareError('Error: Article not found.', 404, 'json');
    }
    if(article.likes.includes(userId)) {
      article.likes = article.likes.filter(like => {
        return like.toString() !== userId.toString();
      });   
      state = 'unliked';  
    } else {
      article.likes.push(userId);
      state = 'liked';
    }
    
    article.save()
    .then(updatedArticle => {
      if(!updatedArticle) {
        throw prepareError('There was an error. Please try again.', 500, 'json');
      }
      numOflikes = updatedArticle.likes.length;
      
      return res.status(200).json({state: state, likes: numOflikes});
    })
  })
  .catch(err => next(err));
}

// GET /articles/latest-articles
// JSON response
exports.getLatestArticles = (req, res, next) => {
  const articleId = req.params.articleId;
  if(!mongoose.isValidObjectId(articleId)) {
    throw prepareError('There was an error loading the latest articles.', 500, 'json');
  }
  
  Article.find({ publishedAt: { $ne: null }, image: { $ne: null }, _id: {$ne: articleId}  })
  .sort({createdAt: 'descending'})
  .limit(2)
  .populate('author', ['firstName', 'lastName'])
  .then( articles => {
    if(!articles) {
      throw prepareError('There was an error. Please try again.', 500, 'json');
    }
    return res.status(200).json(articles);
  })
  .catch(err => next(err));
}