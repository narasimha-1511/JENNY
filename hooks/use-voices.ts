import { useCallback, useEffect } from 'react';
import { useVoiceStore } from '@/store/use-voice-store';
import { supabase } from '@/lib/supabase';

export const useVoices = () => {
  const { 
    voices, 
    selectedVoice, 
    isLoading, 
    error,
    setVoices, 
    setSelectedVoice, 
    setIsLoading, 
    setError,
    twilioInfo,
    setTwilioInfo 
  } = useVoiceStore();

  const loadVoices = useCallback(async () => {
    if(voices.length > 0) return;
    try {
      setIsLoading(true);
      setError(null);

      //get voices
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
      setIsLoading(false);
    }
  }, []);

  const loadTwilioInfo = useCallback(async () => {
    if(twilioInfo.length > 0) return;

    try {

      const { data  , error }  = await supabase
      .from('twilio_credentials')
      .select('id, account_sid, auth_token, from_phone_number')
      .eq('user_id', await supabase.auth.getUser()?.then((user) => user?.data.user?.id));

      if (error) {
        console.error('Error fetching Twilio information:', error);
        return;
      }

      //@ts-ignore
      setTwilioInfo(data || []);

    } catch (error: any) {
      setError(error.message);
      console.error('Error fetching Twilio information:', error);
    }
  }, []);

  

  useEffect(() => {
    loadTwilioInfo();
    
    loadVoices();
  }, []);


  return {
    voices,
    isLoading,
    error,
    twilioInfo
  };
};
