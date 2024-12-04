'use client';

import { useEffect, useState } from 'react';
import { Transcript } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icons';
import { Transcript as Transscript } from "ultravox-client"

interface TranscriptViewProps {
  botId?: string;
  initialTranscripts?: Transscript[] | null
}

export function TranscriptView({ botId ,  initialTranscripts }: TranscriptViewProps) {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (!botId) return;

    const fetchTranscripts = async () => {
      const { data, error } = await supabase
        .from('transcripts')
        .select('*')
        .eq('bot_id', botId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setTranscripts(data);
      }
    };

    fetchTranscripts();

    const channel = supabase
      .channel(`transcripts_${botId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transcripts', filter: `bot_id=eq.${botId}` },
        () => {
          fetchTranscripts();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [botId]);

  if (!botId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Select a bot to view transcripts
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">

      <div className="flex-1 overflow-y-auto p-4">
        {initialTranscripts && initialTranscripts.map((transcript, index) => (
          <div
            key={index}
            className="mb-4 p-4 bg-white rounded-lg shadow"
          >
            <div className="text-sm text-gray-500">
              {new Date(transcript.created_at).toLocaleString()}
            </div>
            <div className="mt-2">
              <span className="font-semibold">
                {transcript.speaker === 'agent' ? 'Bot' : 'User'}:
              </span>
              {transcript.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}