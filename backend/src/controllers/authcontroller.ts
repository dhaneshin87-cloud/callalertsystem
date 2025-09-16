import { Request, Response } from "express";
import { google } from "googleapis";
import { AppDataSource } from "../storage/database";
import { User } from "../models/user";
import bcrypt from 'bcryptjs';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export function googleAuth(req: Request, res: Response) {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile", "https://www.googleapis.com/auth/calendar.events"],
    prompt: "consent",
  });
  res.redirect(url);
}

export async function googleCallback(req: Request, res: Response) {
  try {
    const code = req.query.code as string;

    if (!code) {
      return res.status(400).send("Authorization code is required");
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email!;
    const name = userInfo.data.name!;

    if (!email || !name) {
      return res.status(400).send("Unable to retrieve user information");
    }

    const userRepository = AppDataSource.getRepository(User);
    let user = await userRepository.findOne({ where: { email } });

    if (!user) {
      user = userRepository.create({
        email,
        name,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || undefined,
      });
    } else {
      user.accessToken = tokens.access_token!;
      user.refreshToken = tokens.refresh_token || undefined;
    }

    await userRepository.save(user);

    // Redirect to frontend with token, user ID, etc.
const redirectUrl = `http://localhost:3000/phone?access_token=${encodeURIComponent(
    tokens.access_token!
)}&refresh_token=${encodeURIComponent(tokens.refresh_token!)}&user_id=${encodeURIComponent(user.id)}&email=${encodeURIComponent(user.email)}`;


res.redirect(redirectUrl);
  } catch (error) {
    console.error("Google callback error:", error);
    res.status(500).send("Authentication failed");
  }
}





export async function registerUser(req: Request, res: Response) {
try {
  const { email, password, name } = req.body as { email?: string; password?: string; name?: string };

  if (!email || !password || !name) {
    return res.status(400).json({ message: "email, password, and name are required" });
  }

  const userRepository = AppDataSource.getRepository(User);

  const existing = await userRepository.findOne({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = userRepository.create({
    email,
    name,
    passwordHash,
  });

  await userRepository.save(user);

  return res.status(201).json({
    message: "User created",
    userId: user.id,
    email: user.email,
    name: user.name,
  });
} catch (error) {
  console.error("Register user error:", error);
  return res.status(500).json({ message: "Registration failed" });
}
}

export async function validateToken(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });
    
    if (!user || !user.accessToken || !user.refreshToken) {
      return res.status(401).json({ 
        message: "User not authenticated",
        needsAuth: true 
      });
    }

    // Try to refresh token to validate it
    oauth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken,
    });

    try {
      await oauth2Client.refreshAccessToken();
      return res.json({ 
        message: "Token is valid",
        needsAuth: false 
      });
    } catch (error) {
      return res.status(401).json({ 
        message: "Token expired, re-authentication required",
        needsAuth: true 
      });
    }
  } catch (error) {
    console.error("Token validation error:", error);
    return res.status(500).json({ message: "Token validation failed" });
  }
}