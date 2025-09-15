import { Request, Response } from "express";
import { google } from "googleapis";
import { AppDataSource } from "../storage/database";
import { User } from "../models/user";

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
      return res.status(400).json({ message: "Authorization code is required" });
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
      return res.status(400).json({ message: "Unable to retrieve user information" });
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

    res.json({
      message: "Logged in",
      userId: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error("Google callback error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
}
