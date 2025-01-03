import { create } from 'zustand';
import { Bot } from '@/types/database';
import { supabase } from '@/lib/supabase';

interface BotState {
  // State
  bots: Bot[];
  selectedBotId: string | null;
  
  // Basic Actions
  setBots: (bots: Bot[]) => void;
  setSelectedBotId: (botId: string | null) => void;

  //async functions
  fetchBots: () => Promise<Bot[]>;
  
}

export const useBotStore = create<BotState>((set) => ({
  
  // Initial State
  bots: [],
  selectedBotId: null,

  // Basic Actions
  setBots: (bots) => set({ bots }),
  setSelectedBotId: (selectedBotId) => set({ selectedBotId }),

  //async functions
  fetchBots: async () => {
    const { data, error } = await supabase.from('bots').select('*').eq('user_id', (await supabase.auth.getUser()).data?.user?.id);
    if (error) throw error;
    return data;
  },
}));
