import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

/**
 * POST /api/user/phone
 * Save user phone number
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
    const { phone, email, userId } = await request.json();

    // Validate required fields
    if (!phone || !email) {
      return NextResponse.json(
        { error: 'Phone number and email are required' }, 
        { status: 400 }
      );
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid phone number format' }, 
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' }, 
        { status: 400 }
      );
    }

    // Log the operation
    console.log('Saving phone number:', { 
      phone, 
      email, 
      userId: userId || session.user?.id 
    });

    // TODO: Replace with actual database save
    // await savePhoneNumberToDatabase({ 
    //   phone, 
    //   email, 
    //   userId: userId || session.user?.id 
    // });

    return NextResponse.json({
      success: true,
      message: 'Phone number saved successfully',
      data: { 
        phone, 
        email, 
        userId: userId || session.user?.id 
      }
    });

  } catch (error) {
    console.error('Error saving phone number:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}


