// middleware/honeypot.ts
import { Request, Response, NextFunction } from 'express';

/** HoneyPot field middleware - rejects if the hidden field is filled in  */

export function honeypot(req: Request, res: Response, next: NextFunction) {
    if (req.body.honeypot) return res.sendStatus(400);
    next();
  }
  