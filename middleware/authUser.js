const jwt = require("jsonwebtoken");

const authUser = async (req, res, next) => {
  try {
    const token = req.headers["authorization"].split(" ").pop();
    if (!token) {
      return res.status(401).json({ msg: "Unauthorized." });
    }

    const decoded = jwt.verify(token, process.env.SECRETKEY);
    if (!decoded) {
      return res.status(403).json({ msg: "Forbidden" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(500).json({ err: err.message });
  }
};

module.exports = {
  authUser,
};
