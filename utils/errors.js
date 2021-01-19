exports.prepareError = (message, statusCode, type='html') => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.response = type;
    return error;
}

