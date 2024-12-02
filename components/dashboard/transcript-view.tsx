'use client';

import { useEffect, useState } from 'react';
import { Transcript } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icons';

interface TranscriptViewProps {
  botId?: string;
}

export function TranscriptView({ botId }: TranscriptViewProps) {
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
      <div className="border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Transcripts</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
            >
              <Icon name={isMuted ? 'micOff' : 'mic'} className="h-4 w-4" />
            </Button>
            <Button
              variant={isDemo ? 'default' : 'outline'}
              onClick={() => setIsDemo(!isDemo)}
              className="flex items-center gap-2"
            >
              <Icon name={isDemo ? 'phoneOff' : 'phone'} className="h-4 w-4" />
              {isDemo ? 'End Demo' : 'Start Demo'}
            </Button>
            <Button className="flex items-center gap-2">
              <Icon name="phone" className="h-4 w-4" />
              Start Call
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {transcripts.map((transcript) => (
          <div
            key={transcript.id}
            className="mb-4 p-4 bg-white rounded-lg shadow"
          >
            <div className="text-sm text-gray-500">
              {new Date(transcript.created_at).toLocaleString()}
            </div>
            <div className="mt-2">{transcript.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}