module.exports = (req, res, next) => {
    const token = req.cookies.jwToken
    req.token = token;
    next();
};
