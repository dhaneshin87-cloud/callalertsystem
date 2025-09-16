import { google } from "googleapis";
import { AppDataSource } from "../storage/database";
import { User } from "../models/user";

// Create OAuth2 client instance
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Function to refresh access token if needed
async function ensureValidToken(userId: string): Promise<string> {
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { id: userId } });
  
  if (!user || !user.accessToken) {
    throw new Error("User not found or no access token");
  }

  try {
    // Set current credentials
    oauth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken,
    });

    // Try to refresh the token
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    // Update user with new tokens
    user.accessToken = credentials.access_token!;
    if (credentials.refresh_token) {
      user.refreshToken = credentials.refresh_token;
    }
    
    await userRepository.save(user);
    
    return credentials.access_token!;
  } catch (error) {
    console.error("Token refresh failed:", error);
    throw new Error("Failed to refresh access token. User needs to re-authenticate.");
  }
}

export async function insertGoogleEvent(userId: string, event: any) {
  try {
    const accessToken = await ensureValidToken(userId);
    
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth });
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    return response.data;
  } catch (error) {
    console.error("Google Calendar insert error:", error);
    throw error;
  }
}

export async function listUpcomingEvents(userId: string) {
  try {
    const accessToken = await ensureValidToken(userId);
    
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth });
    const now = new Date();
    const inFiveMinutes = new Date(now.getTime() + 5 * 60 * 1000);

    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: inFiveMinutes.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    return res.data.items || [];
  } catch (error) {
    console.error("Google Calendar list error:", error);
    throw error;
  }
}
