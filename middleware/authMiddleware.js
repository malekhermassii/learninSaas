// A middleware is a function that sits between the request and the response in a web application. It can modify the request or response, perform actions (like logging, authentication, validation), or end the request-response cycle.
const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {  // Middleware function exported for use in the application.
  try {
    // Check session first
    if (req.session.userId) {  // If a session exists with a user ID (i.e., the user is logged in via session)
      req.user = { userId: req.session.userId };  // Attach user data (user ID) to the request object.
      return next();  // Pass control to the next middleware or route handler.
    }

    // Fallback to JWT
    const token = req.headers.authorization?.split(' ')[1];  // Check if the Authorization header contains a token (usually in the form "Bearer <token>").
    if (!token) throw new Error('Authentication required');  // If no token is found, throw an error.

    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verify the JWT using the secret key.
    req.user = decoded;  // Attach the decoded user data (from the token) to the request object.
    next();  // Pass control to the next middleware or route handler.
  } catch (error) {  // If any error occurs during the process, catch it.
    res.status(401).json({ message: error.message || 'Authentication failed' });  // Respond with a 401 Unauthorized error and a message.
  }
};
// This code is a middleware function that handles user authentication. It first checks if the user is authenticated via a session. If a session is not found, it checks for a JWT token in the request headers. If the token is valid, it attaches the user data to the request and allows the request to proceed. If authentication fails (no session or invalid token), it responds with a 401 Unauthorized error.
// We use this middleware to ensure that only authenticated users can access certain routes in the application