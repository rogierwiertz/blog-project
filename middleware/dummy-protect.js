const {prepareError} = require("../utils/errors");

module.exports = (type = 'redirect', url = null) => {
    return (req, res, next) => {
        if (req.session.isDummyUser ) {
            switch (type) {
                case 'json':
                    throw prepareError('This functionality is not available for dummy users.', 403, 'json');
                    break;
                default:
                    if (!url) {
                        url = req.originalUrl;
                    }
                    req.flash("error", 'This functionality is not available for dummy users.');
                    return res.redirect(url);
                    break;
            }
        }
        next();

    }
}