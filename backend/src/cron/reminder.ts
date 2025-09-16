import * as cron from 'node-cron';
import { AppDataSource } from "../storage/database";
import { User } from "../models/user";
import { Event } from '../models/event';
import { listUpcomingEvents } from "../lib/google";
import { makeCall } from "../lib/twilio";
import { Server } from "socket.io";
import { In } from "typeorm";

export function setupReminderJob(io: Server, callback: (results: any[]) => void) {
  cron.schedule("* * * * *", async () => {
    console.log("🕒 Running event reminder job...");
    const results: any[] = [];
    const userRepository = AppDataSource.getRepository(User);
    const eventRepository = AppDataSource.getRepository(Event);

    // Limit to connected users from WebSocket
    const connectedUserIds = new Set<string>();
    for (const [, s] of io.sockets.sockets) {
      if (s.data?.userId) connectedUserIds.add(s.data.userId);
    }
console.log("connecteduserids",connectedUserIds)
    if (connectedUserIds.size === 0) {
      callback([]); // nothing to do if no connected users
      return;
    }

    const users = await userRepository.find({
      where: { id: In([...connectedUserIds]) }
    });
    for (const user of users) {
      try {
       

        const eventsList = await listUpcomingEvents(user.id);
        for (const eventItem of eventsList) {    
          if (!eventItem.id) continue; // Skip events without ID
          
          const event = await eventRepository.findOne({ 
            where: { 
              googleEventId: eventItem.id, 
              userId: user.id 
            } 
          });
          
          console.log("event", event);
          if (event) {
            const message = `Reminder: ${event.name} at ${event.date}`;
            const callResult = await makeCall(event.phoneNumber, message);
            console.log(`Call made to ${event.phoneNumber}`);
            
            // Add result to array
            results.push({
              userId: user.id,
              userEmail: user.email,
              eventId: event.id,
              eventName: event.name,
              phoneNumber: event.phoneNumber,
              timestamp: new Date().toISOString(),
              callResult: callResult,
              success: true
            });
          }
        }
      } catch (error) {
        console.error(`Error for user ${user.email}:`, error);
        
        // Add error result to array
        results.push({
          userId: user.id,
          userEmail: user.email,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        });
      }
    }

    // Call the callback with results
    callback(results);
  });
}
