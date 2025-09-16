import Twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const client = Twilio(accountSid, authToken);

export async function makeCall(to: string, message: string) {
  try {
    if (!accountSid || !authToken || !process.env.TWILIO_PHONE_NUMBER) {
      throw new Error("Twilio configuration is missing");
    }

    return await client.calls.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER!,
      twiml: `<Response><Say>${message}</Say></Response>`,
      statusCallback: 'https://localhost:5000/twilio/status-callback',
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST'
    });
  } catch (error) {
    console.error("Twilio call error:", error);
    throw error;
  }
}
