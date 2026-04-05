const jwt = require('jsonwebtoken');

// This middleware runs BEFORE protected routes
// It checks if the user has a valid JWT token before letting them in
const auth = (req, res, next) => {

  // Get the token from the request header
  // The client sends it like: Authorization: "Bearer eyJhbGci..."
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // If no token is found, reject the request immediately
  if (!token) {
    return res.status(401).json({ message: 'No token, access denied' });
  }

  try {
    // Verify the token using our JWT secret
    // If the token is valid, decoded will contain the user's data we stored in it
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded user data to the request object
    // Now any route that uses this middleware can access req.user
    req.user = decoded;

    // Call next() to move on to the actual route handler
    next();

  } catch (err) {
    // If the token is invalid or expired, reject the request
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
