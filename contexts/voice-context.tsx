'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Voice {
  voiceId: string;
  name: string;
  previewUrl: string;
}

interface VoiceContextType {
  voices: Voice[];
  loading: boolean;
  error: string | null;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('/api/voice');
        if (!response.ok) {
          throw new Error('Failed to fetch voices');
        }
        const data = await response.json();
        setVoices(data);
      } catch (error: any) {
        setError(error.message);
        console.error('Error fetching voices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVoices();
  }, []);

  return (
    <VoiceContext.Provider value={{ voices, loading, error }}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
