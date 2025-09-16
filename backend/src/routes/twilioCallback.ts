// routes/twilioCallback.ts
import { Router } from "express";
import { Server as SocketIOServer } from "socket.io";

export function setupTwilioCallback(io: SocketIOServer) {
  const router = Router();

  router.post("/twilio/status-callback", (req, res) => {
    const { CallSid, CallStatus, From, To } = req.body;

    console.log(`Twilio callback received: CallSid=${CallSid}, Status=${CallStatus}`);

    // Find the socket(s) based on the 'To' phone number
    for (const [, socket] of io.sockets.sockets) {
      if (socket.data?.phoneNumber === To) {
        socket.emit("call-status-update", {
          callSid: CallSid,
          callStatus: CallStatus,
          from: From,
          to: To,
          timestamp: new Date().toISOString(),
        });
        console.log(`Sent call status to user ${socket.data.userId}`);
      }
    }

    res.sendStatus(200); // Respond to Twilio
  });

  return router;
}
