export interface Bot {
  id: string;
  created_at: string;
  phone_number: string;
  voice: string;
  system_prompt: string;
  user_id: string;
}

export interface Transcript {
  id: string;
  created_at: string;
  bot_id: string;
  content: string;
}