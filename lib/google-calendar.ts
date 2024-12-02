import { google } from 'googleapis';
import { supabase } from './supabase';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`
);

const createOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`
  );
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0) throw error;

    // Handle rate limit errors
    if (error?.response?.status === 429 || error?.message?.includes('rate limit')) {
      const retryAfter = parseInt(error?.response?.headers?.['retry-after'] || '60', 10);
      console.log(`Rate limited. Waiting ${retryAfter} seconds before retry...`);
      await wait(retryAfter * 1000);
    } else {
      await wait(delay);
    }

    return withRetry(fn, retries - 1, delay * 2);
  }
};

export const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

export function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'email',
      'profile',
    ],
    prompt: 'consent',
  });
}

export async function getTokens(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const oauth2Client = createOAuth2Client();

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    return {
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token || refreshToken,
      expires_in: credentials.expiry_date ? 
        Math.floor((credentials.expiry_date - Date.now()) / 1000) : 
        3600
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
}

export async function getUserCalendarAccounts(userId: string) {
  const { data, error } = await supabase
    .from('user_calendar_accounts')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

export async function addCalendarAccount(userId: string, tokens: any, email: string) {
  const { error } = await supabase
    .from('user_calendar_accounts')
    .insert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      calendar_email: email,
      expires_at: new Date(Date.now() + tokens.expiry_date * 1000).toISOString(),
    });

  if (error) throw error;
}

export async function listEvents(accessToken: string, options: { timeMin?: string; timeMax?: string }) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  return withRetry(async () => {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: options.timeMin,
      timeMax: options.timeMax,
      maxResults: 1000,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items;
  });
};

export async function createEvent(accessToken: string, eventData: any, calendarId: string = 'primary') {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  return withRetry(async () => {
    try {
      const response = await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: eventData.summary,
          description: eventData.description,
          start: {
            dateTime: eventData.start.dateTime,
            timeZone: eventData.start.timeZone,
          },
          end: {
            dateTime: eventData.end.dateTime,
            timeZone: eventData.end.timeZone,
          },
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error creating event:', error);
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Please check your calendar permissions');
      }
      throw error;
    }
  });
};

export async function updateEvent(
  accessToken: string,
  eventId: string,
  eventData: any,
  calendarId: string = 'primary'
) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  return withRetry(async () => {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.events.update({
      calendarId,
      eventId,
      requestBody: eventData,
    });

    return response.data;
  });
};

export async function deleteEvent(
  accessToken: string,
  eventId: string,
  calendarId: string = 'primary'
) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  return withRetry(async () => {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    await calendar.events.delete({
      calendarId,
      eventId,
    });
  });
};
