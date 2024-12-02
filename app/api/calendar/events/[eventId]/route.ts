import { NextRequest } from 'next/server';
import { updateEvent, deleteEvent } from '@/lib/google-calendar';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { calendarId, event } = await req.json();

    const { data: account } = await supabase
      .from('user_calendar_accounts')
      .select('*')
      .eq('id', calendarId)
      .single();

    if (!account) {
      throw new Error('Calendar account not found');
    }

    const updatedEvent = await updateEvent(
      account.access_token,
      params.eventId,
      event
    );
    return new Response(JSON.stringify(updatedEvent), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update event' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { calendarId } = await req.json();

    const { data: account } = await supabase
      .from('user_calendar_accounts')
      .select('*')
      .eq('id', calendarId)
      .single();

    if (!account) {
      throw new Error('Calendar account not found');
    }

    await deleteEvent(account.access_token, params.eventId);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete event' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
