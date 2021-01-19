const path = require("path");

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const session = require("express-session");
const MongoDbStore = require("connect-mongodb-session")(session);
const flash = require("connect-flash");
const csurf = require("csurf");

const dotenv = require('dotenv');

dotenv.config({path: 'config.env'});

const MONGODB_URL = process.env.MONGODB_URL;

const store = new MongoDbStore({
  uri: MONGODB_URL,
  collection: "sessions",
});

const app = express();
const csrfProtection = csurf();

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,     
  })
);


app.use(csrfProtection);

app.use((req, res, next) => {
  res.locals.loggedIn = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  if (req.session.isLoggedIn) {
    res.locals.username = req.session.user.name;
    res.locals.userId = req.session.user._id;
    res.locals.user = req.session.user;
  }
  next();
});

app.use(flash());

// Routes
const mainRoutes = require("./routes/main");
const articleRoutes = require("./routes/article");
const profileRoutes = require("./routes/profile");
const blogRoutes = require("./routes/blog");
const errorController = require("./controllers/error");
app.use(mainRoutes);
app.use("/article", articleRoutes);
app.use("/profile", profileRoutes);
app.use("/blog", blogRoutes);
app.use(errorController.get404);

app.use((error, req, res, next) => {
  console.log(error.message);
  if (!error.statusCode) {
    error.statusCode = 500;
  }
  if(error.code === "EBADCSRFTOKEN") {
    return res.render(`${error.statusCode}.ejs`, {
      title: error.statusCode,
      path: "",
      loggedIn: req.session.isLoggedIn,
      csrfToken: req.csrfToken()
    });
  }
  
  if (error.response === "json") {
    return res.status(error.statusCode).json({
      message: error.message,
      statusCode: error.statusCode,
    });
  }

  res.render(`${error.statusCode}.ejs`, {
    title: error.statusCode,
    path: "",
  });
});

const PORT = process.env.PORT || 3000;

mongoose.connect(
  MONGODB_URL,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err) => {
    app.listen(3000, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  }
);

