const jwt = require("jsonwebtoken");

// Verify the JWT and identify the authenticated user
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication token required",
    });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    return res.status(401).json({
      error: "Authentication token required",
    });
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("JWT_SECRET is not configured");

    return res.status(500).json({
      error: "Authentication service is not configured",
    });
  }

  jwt.verify(token, secret, (error, decoded) => {
    if (error || !decoded || typeof decoded !== "object") {
      return res.status(401).json({
        error: "Invalid or expired token",
      });
    }

    if (
      typeof decoded.sub !== "string" ||
      !["student", "faculty", "admin"].includes(decoded.role)
    ) {
      return res.status(401).json({
        error: "Invalid authentication token payload",
      });
    }

    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };

    next();
  });
}

// Restrict access to specified roles
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "You do not have permission to access this resource",
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
};
