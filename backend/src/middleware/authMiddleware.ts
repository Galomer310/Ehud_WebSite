import { Request, Response, NextFunction } from 'express'; // Import Express types for Request, Response, and NextFunction
import jwt from 'jsonwebtoken';                           // Import JSON Web Token library

// Middleware function to authenticate JWT tokens in incoming requests
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  // Retrieve the authorization header; expected format: "Bearer TOKEN"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from header

  // If no token is provided, respond with a 401 Unauthorized status
  if (!token) return res.sendStatus(401);

  // Verify the token using the secret from the environment variables
  jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
    // If verification fails, respond with 403 Forbidden status
    if (err) return res.sendStatus(403);
    // Attach the user data to the request object for use in subsequent middleware/routes
    (req as any).user = user;
    next();  // Proceed to the next middleware or route handler
  });
}
