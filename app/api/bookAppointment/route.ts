import { createCalendarEvent } from '@/lib/edge-calendar';
import { NextResponse , NextRequest } from 'next/server';

export const runtime = 'edge';


export async function POST(request: NextRequest) {
    try {
      // Get tokens from query parameters
      const searchParams = request.nextUrl.searchParams;
      const accessToken = searchParams.get("calendar_access_token");
      const refreshToken = searchParams.get("calendar_refresh_token");

      console.log("Access token:", accessToken);
      console.log("Refresh token:", refreshToken);
      console.log("Request body:", await request.json());
  
      if (!accessToken || !refreshToken) {
        return NextResponse.json(
          { error: "Calendar tokens not provided" },
          { status: 401 }
        );
      }
  
      const body = await request.json();
      const { appointmentDetails: details } = body;
  
      if (!details) {
        return NextResponse.json(
          { error: "Appointment details not provided" },
          { status: 400 }
        );
      }
  
      // Handle relative dates
      let preferredDate = details.preferredDate;
      if (preferredDate.toLowerCase() === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        preferredDate = tomorrow.toISOString().split('T')[0];
      }
  
      // Convert 12-hour time to 24-hour time
      let preferredTime = details.preferredTime;
      if (preferredTime) {
        const [time, period] = preferredTime.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        
        let hour24 = hours;
        if (period === 'PM' && hours !== 12) {
          hour24 = hours + 12;
        } else if (period === 'AM' && hours === 12) {
          hour24 = 0;
        }
  
        preferredTime = `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
  
      // Convert the date and time to a DateTime object
      const startDateTime = new Date(`${preferredDate}T${preferredTime}`);
      const endDateTime = new Date(startDateTime);
  
      // Validate the date is not in the past
      if (startDateTime < new Date()) {
        return NextResponse.json(
          { error: "Cannot book appointments in the past" },
          { status: 400 }
        );
      }
  
      // Set duration based on appointment type
      const durationMap = {
        consultation: 60,
        follow_up: 30,
        general: 45,
        urgent: 30,
      };
  
      const duration =
        durationMap[details.appointmentType as keyof typeof durationMap] || 60;
      endDateTime.setMinutes(endDateTime.getMinutes() + duration);
  
      // Create event object
      const event = {
        summary: `${details.appointmentType.toUpperCase()} - ${details.firstName} ${details.lastName}`,
        description: `Appointment Type: ${details.appointmentType}\nNotes: ${details.notes || "None"}`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: "UTC",
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: "UTC",
        },
        attendees: [{ email: details.email }],
        reminders: {
          useDefault: true,
        },
      };
  
      // Create the calendar event using the provided access token
      const calendarEvent = await createCalendarEvent(event, accessToken);
  
      return NextResponse.json(
        {
          success: true,
          message: "Appointment booked successfully",
          event: calendarEvent,
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error("Error booking appointment:", error);
      return NextResponse.json(
        { error: error.message || "Failed to book appointment" },
        { status: error.status || 500 }
      );
    }
  }