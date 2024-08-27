export const isAuth = function (req, res, next) {
  if (req.user) {
    next(); // moves on
  } else {
    res.status(401).json({
      message: "You are not authorized",
      user: req.user,
      session: req.session,
    });
  }
};

export const isAdmin = function (req, res, next) {
  if (req.isAuthenticated() && req.user.admin) {
    next(); // moves on
  } else {
    res.status(401).json({ message: "You are not an admin" });
  }
};
