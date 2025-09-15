import { google } from "googleapis";

export async function insertGoogleEvent(accessToken: string, event: any) {
  try {
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

export async function listUpcomingEvents(accessToken: string) {
  try {
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
