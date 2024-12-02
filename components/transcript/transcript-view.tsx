'use client';

import { useEffect, useState } from 'react';
import { Transcript } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { PhoneCall, PhoneOff, Mic, MicOff } from 'lucide-react';

export function TranscriptView({ botId }: { botId?: string }) {
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
  }, [botId]);

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Transcripts</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant={isDemo ? 'default' : 'outline'}
              onClick={() => setIsDemo(!isDemo)}
              className="flex items-center gap-2"
            >
              {isDemo ? (
                <>
                  <PhoneOff className="h-4 w-4" />
                  End Demo
                </>
              ) : (
                <>
                  <PhoneCall className="h-4 w-4" />
                  Start Demo
                </>
              )}
            </Button>
            <Button>
              <PhoneCall className="h-4 w-4 mr-2" />
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