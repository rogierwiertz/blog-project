const { body, validationResult } = require("express-validator");
const xss = require("xss");

//Log validation errors to the console
const errorLogger = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    console.log("Geen validation error:", errors.array());
  } else {
    console.log("Validation error:", errors.array());
  }
};

const validate = async (req, res, next, validations) => {
  for (let validation of validations) {
    const result = await validation.run(req);
    if (result.errors.length > 0) {
      break;
    }
  }
  // errorLogger(req, res, next);
  next();
};

// XSS prevention
const xssPrevention = (value) => {
    const whitelist = xss.whiteList;
    whitelist.p = ['class'];
    whitelist.blockquote = ['class'];
    whitelist.span = ['style'];
    whitelist.img = ['src', 'alt', 'title', 'width', 'height', 'class'];
    // console.log(whitelist);
  return xss(value); 
};

exports.signUpForm = (req, res, next) => {
  const validations = [
    body(
      ["firstName", "lastName", "email", "password", "confirmPassword"],
      "All fields are required."
    ).isLength({ min: 1 }),
    body(["firstName", "lastName"])
      .isString()
      .isLength({ max: 20 })
      .withMessage("First Name / Last Name must be under 20 characters.")
      .trim(),
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email address.")
      .normalizeEmail()
      .trim(),
    body("password")
      .matches(
        /^(?=.{8,}$)(?=[^a-z]*[a-z])(?=[^A-Z]*[A-Z])(?=\D*\d)(?=.*[\W|_]).*/
      )
      .withMessage(
        "Password needs to include both lower and upper case characters, at least one number, one symbol and be at least 8 characters long."
      ),
    body("confirmPassword")
      .equals(req.body.password)
      .withMessage("Passwords don't match."),
  ];
  validate(req, res, next, validations);
};

exports.loginForm = (req, res, next) => {
  
  const validations = [
    body(["email", "password"], "All fields are required.").isLength({
      min: 1,
    }),
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email address.")
      .normalizeEmail()
      .trim(),
  ];
  validate(req, res, next, validations);
};

exports.postForm = (req, res, next) => {
  const validations = [
    body("title", "Please enter a valid title.")
      .isString()
      .trim()
      .isLength({ min: 3 })
      .withMessage("Title must be at least 3 characters."),
    body("description", "Please enter a valid description.")
    .isString()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Description must be at least 3 characters."),
    body("content")
      .isString()
      .isLength({ min: 5, max: 5000 })
      .withMessage("Content should be between 5 - 5000 characters.")
      .trim().customSanitizer(value => {
        return xssPrevention(value);
      }),
  ];
  

  validate(req, res, next, validations);
};
exports.deleteAccountForm = (req, res, next) => {
  const validations = [
    body("password")
      .isLength({ min: 1 })
      .withMessage("Please enter your password"),
  ];
  validate(req, res, next, validations);
};

exports.changePassword = (req, res, next) => {
  const validations = [
    body("password")
      .matches(
        /^(?=.{8,}$)(?=[^a-z]*[a-z])(?=[^A-Z]*[A-Z])(?=\D*\d)(?=.*[\W|_]).*/
      )
      .withMessage(
        "Password needs to include both lower and upper case characters, at least one number, one symbol and be at least 8 characters long."
      ),
    body("confirmPassword")
      .equals(req.body.password)
      .withMessage("Passwords don't match."),
  ];
  validate(req, res, next, validations);
};

exports.updateProfileForm = (req, res, next) => {
  const validations = [
    body(
      ["firstName", "lastName", "email"],
      "Name and email address are required fields."
    ).isLength({ min: 1 }),
    body(["firstName", "lastName"])
      .isString()
      .isLength({ max: 20 })
      .withMessage("First Name / Last Name must be under 20 characters.")
      .trim(),
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email address.")
      .normalizeEmail()
      .trim(),
    body('about')
    .isString()
    .isLength({max: 200})
    .withMessage("About me must be under 200 characters.")
    .trim(),
    body('facebook')
    .trim()
    .if(value => {
      return value !== "";
    })
    .isURL({host_whitelist: ['www.facebook.com']})
    .withMessage('Please provide a valid Facebook URL.'),
    body('linkedIn')
    .trim()
    .if(value => {
      return value !== "";
    })
    .isURL({host_whitelist: ['www.linkedin.com']})
    .withMessage('Please provide a valid LinkedIn URL.'),
    body('twitter')
    .trim()
    .if(value => {
      return value !== "";
    })
    .isURL({host_whitelist: ['twitter.com']})
    .withMessage('Please provide a valid Twitter URL.'),
  ];
  validate(req, res, next, validations);
}

exports.addCommentForm = (req, res, next) => {
  const validations = [
    body("message")
    .isString()
    .isLength({min: 1, max: 250})
    .withMessage(
        "Comment should be under 250 characters."
      )
    .trim()    
  ];
  validate(req, res, next, validations);
}