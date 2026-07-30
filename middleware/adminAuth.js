module.exports = {
  ensureAdmin: (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
      return next();
    }
    req.session.error = 'Acesso negado. Apenas administradores podem realizar esta ação.';
    res.redirect('/');
  }
};
