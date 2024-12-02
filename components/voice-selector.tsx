'use client';

import { useVoice } from '@/contexts/voice-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function VoiceSelector() {
  const { voices, selectedVoice, setSelectedVoice, loading, error } = useVoice();

  if (loading) {
    return <div>Loading voices...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Select
      value={selectedVoice?.voice_id}
      onValueChange={(value) => {
        const voice = voices.find((v) => v.voice_id === value);
        if (voice) {
          setSelectedVoice(voice);
        }
      }}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a voice" />
      </SelectTrigger>
      <SelectContent>
        {voices.map((voice) => (
          <SelectItem key={voice.voice_id} value={voice.voice_id}>
            {voice.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
