import * as cron from 'node-cron';
import { AppDataSource } from "../storage/database";
import { User } from "../models/user";
import { Event } from '../models/event';
import { listUpcomingEvents } from "../lib/google";
import { makeCall } from "../lib/twilio";

export function setupReminderJob() {
  cron.schedule("* * * * *", async () => {
    console.log("Running event reminder job...");

    const userRepository = AppDataSource.getRepository(User);
    const eventRepository = AppDataSource.getRepository(Event);

    const users = await userRepository.find();

    for (const user of users) {
      try {
        const eventsList = await listUpcomingEvents(user.accessToken);

        for (const eventItem of eventsList) {
          if (!eventItem.id) continue; // Skip events without ID
          
          const event = await eventRepository.findOne({ 
            where: { 
              googleEventId: eventItem.id, 
              userId: user.id 
            } 
          });

          if (event) {
            const message = `Reminder: ${event.name} at ${event.date}`;
            await makeCall(event.phoneNumber, message);
            console.log(`Call made to ${event.phoneNumber}`);
          }
        }
      } catch (error) {
        console.error(`Error for user ${user.email}:`, error);
      }
    }
  });
}
