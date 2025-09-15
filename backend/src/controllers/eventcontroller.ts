import { Request, Response } from "express";
import { AppDataSource } from "../storage/database";
import { User } from "../models/user";
import { Event } from "../models/event";
import { insertGoogleEvent } from "../lib/google";

export async function createEventHandler(req: Request, res: Response) {
  try {
    const { name, description, date, endDate, phoneNumber, userId } = req.body;

    if (!name || !date || !endDate || !phoneNumber || !userId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const userRepository = AppDataSource.getRepository(User);
    const eventRepository = AppDataSource.getRepository(Event);

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const eventData = await insertGoogleEvent(user.accessToken, {
      summary: name,
      description,
      start: { dateTime: date },
      end: { dateTime: endDate },
    });

    if (!eventData.id) {
      return res.status(500).json({ message: "Failed to create Google Calendar event" });
    }

    const event = eventRepository.create({
      name,
      description,
      date,
      endDate,
      phoneNumber,
      email: user.email,
      googleEventId: eventData.id,
      userId: user.id,
    });

    await eventRepository.save(event);

    res.json(event);
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({ message: "Failed to create event" });
  }
}

export async function listEventsHandler(req: Request, res: Response) {
  try {
    const { userId, page = 1, limit = 10 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const eventRepository = AppDataSource.getRepository(Event);
    
    // Calculate pagination
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    // Get total count for pagination info
    const totalCount = await eventRepository.count({ where: { userId: userId as string } });
    
    // Get events with pagination, ordered by date (newest first)
    const events = await eventRepository.find({
      where: { userId: userId as string },
      order: { date: "DESC" },
      skip,
      take: limitNumber,
    });

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.json({
      events,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalCount,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
    });
  } catch (error) {
    console.error("List events error:", error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
}
