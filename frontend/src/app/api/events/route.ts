import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

/**
 * POST /api/events/eventcreate
 * Create a new event
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Parse request body
    const { 
      name, 
      description, 
      date, 
      endDate, 
      phoneNumber, 
      email, 
      googleEventId, 
      userId 
    } = await request.json();

    // Validate required fields
    if (!name || !date || !phoneNumber) {
      return NextResponse.json(
        { error: 'Event name, date, and phone number are required' }, 
        { status: 400 }
      );
    }

    // Validate date format
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' }, 
        { status: 400 }
      );
    }

    // Validate end date if provided
    if (endDate) {
      const eventEndDate = new Date(endDate);
      if (isNaN(eventEndDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid end date format' }, 
          { status: 400 }
        );
      }
      
      if (eventEndDate <= eventDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' }, 
          { status: 400 }
        );
      }
    }

    // Validate phone number format
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid phone number format' }, 
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' }, 
          { status: 400 }
        );
      }
    }

    // Log the operation
    console.log('Saving event:', { 
      name, 
      description, 
      date, 
      endDate, 
      phoneNumber, 
      email, 
      googleEventId, 
      userId: userId || session.user?.id 
    });

    // TODO: Replace with actual database save
    // await saveEventToDatabase({ 
    //   name, 
    //   description, 
    //   date, 
    //   endDate, 
    //   phoneNumber, 
    //   email, 
    //   googleEventId, 
    //   userId: userId || session.user?.id 
    // });

    return NextResponse.json({
      success: true,
      message: 'Event saved successfully',
      data: { 
        name, 
        description, 
        date, 
        endDate, 
        phoneNumber, 
        email, 
        googleEventId, 
        userId: userId || session.user?.id 
      }
    });

  } catch (error) {
    console.error('Error saving event:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
