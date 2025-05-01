import fetch from "node-fetch";
import { Request, Response, NextFunction } from "express";

/**
 * Google reCAPTCHA v3 verification middleware.
 * ‑ expects `recaptchaToken` in `req.body` (sent from the browser).
 * ‑ rejects if score < 0.5 or the API call fails.
 */
export async function verifyRecaptcha(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.body.recaptchaToken;
  if (!token) {
    return res.status(400).json({ error: "No CAPTCHA token" });
  }

  try {
    const params = new URLSearchParams();
    params.append("secret", process.env.RECAPTCHA_SECRET as string);
    params.append("response", token);
    params.append("remoteip", req.ip || "");

    const r = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data: any = await r.json();

    // For v3 we also look at the score; success is already checked.
    if (!data.success || (typeof data.score === "number" && data.score < 0.5)) {
      return res.status(403).json({ error: "Suspicious activity detected" });
    }

    next();
  } catch (err) {
    console.error("reCAPTCHA verification failed:", err);
    next(err);
  }
}