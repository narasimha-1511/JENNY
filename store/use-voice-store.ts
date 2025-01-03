import { create } from 'zustand';
import {  Voice } from '@/lib/types';
import { TwilioCredentials } from '@/types/twilio';

interface VoiceState {
  
  // Intial State
  voices: Voice[];
  selectedVoice: Voice | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setVoices: (voices: Voice[]) => void;
  setSelectedVoice: (voice: Voice | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  //lets store the twilio here
  twilioInfo: TwilioCredentials[];
  setTwilioInfo: (twilioInfo: TwilioCredentials[]) => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  
  voices: [],
  selectedVoice: null,
  isLoading: false,
  error: null,

  setVoices: (voices) => set({ voices }),
  setSelectedVoice: (voice) => set({ selectedVoice: voice }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  twilioInfo: [],
  setTwilioInfo: (twilioInfo) => set({ twilioInfo }),
}));
