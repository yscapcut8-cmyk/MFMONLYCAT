module.exports = {
  ensureAuthenticated: (req, res, next) => {
    if (req.session && req.session.userId) {
      return next();
    }
    res.redirect('/login');
  },
  ensureGuest: (req, res, next) => {
    if (req.session && req.session.userId) {
      return res.redirect('/');
    }
    next();
  }
};
