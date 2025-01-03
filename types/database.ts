export interface Bot {
  id: string;
  created_at: string;
  name: string;
  phone_number: string;
  voice: string;
  system_prompt: string;
  user_id: string;
  is_appointment_booking_allowed: boolean;
  appointment_tool_id?: string;
}

export interface Transcript {
  id: string;
  created_at: string;
  bot_id: string;
  content: string;
}