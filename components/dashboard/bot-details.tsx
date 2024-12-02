'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Icon } from '@/components/ui/icons';
import { TranscriptView } from './transcript-view';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVoice } from '@/contexts/voice-context';

const formSchema = z.object({
  name: z.string().min(1, 'Bot name is required'),
  phone_number: z.string().optional(),
  voice: z.string().min(1, 'Please select a voice'),
  system_prompt: z.string().min(1, 'System prompt is required'),
});

type FormData = z.infer<typeof formSchema>;

interface BotDetailsProps {
  botId: string;
}

export function BotDetails({ botId }: BotDetailsProps) {
  const [loading, setLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const { voices, loading: voicesLoading, error: voicesError } = useVoice();

  const selectedVoice = watch('voice');

  useEffect(() => {
    console.log("voicesss" , voices)

    if(voicesLoading || voicesError ) return;
    // if(!selectedVoice) return;
    
    console.log("voicesss" , voices)
  } , [voices])

  useEffect(() => {
    const fetchBot = async () => {
      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .eq('id', botId)
        .single();

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch bot details',
          variant: 'destructive',
        });
        return;
      }

      if (data) {
        setValue('name', data.name);
        setValue('phone_number', data.phone_number);
        setValue('voice', data.voice);
        setValue('system_prompt', data.system_prompt);
      }
    };

    fetchBot();
  }, [botId, setValue, toast]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bots')
        .update(data)
        .eq('id', botId);

      if (error) {
        toast({
          title: 'Error updating bot',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Bot updated successfully',
      });
    } catch (error) {
      console.error('Error updating bot:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    toast({
      title: 'Starting call',
      description: 'Initiating call with the bot...',
    });
  };

  const handleDemoCall = () => {
    toast({
      title: 'Starting demo',
      description: 'Initiating demo call...',
    });
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    toast({
      title: isMuted ? 'Bot unmuted' : 'Bot muted',
      description: `The bot has been ${isMuted ? 'unmuted' : 'muted'}.`,
    });
  };

  return (
    <div className="flex h-full gap-6">
      {/* Left Panel - Bot Configuration */}
      <div className="w-1/2 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Bot Configuration</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Bot Name</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="My Assistant"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone_number">Phone Number (Optional)</Label>
              <Input
                id="phone_number"
                {...register('phone_number')}
                placeholder="+1234567890"
              />
              {errors.phone_number && (
                <p className="text-sm text-red-500">{errors.phone_number.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="voice">Voice</Label>
              <Select onValueChange={(value) => setValue('voice', value)} value={selectedVoice}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.voiceId} value={voice.voiceId}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.voice && (
                <p className="text-sm text-red-500">{errors.voice.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="system_prompt">System Prompt</Label>
              <Textarea
                id="system_prompt"
                {...register('system_prompt')}
                placeholder="Enter the system prompt..."
                className="h-32"
              />
              {errors.system_prompt && (
                <p className="text-sm text-red-500">{errors.system_prompt.message}</p>
              )}
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </div>
      </div>

      {/* Right Panel - Actions & Transcripts */}
      <div className="w-1/2 space-y-6">
        {/* Actions Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Actions</h2>
          <div className="flex gap-2">
            <Button 
              className="flex-1 flex items-center justify-center gap-2" 
              onClick={handleCall}
            >
              <Icon name="phone-call" className="h-4 w-4" />
              Start Call
            </Button>

            <Button 
              variant="secondary"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={handleDemoCall}
            >
              <Icon name="play-circle" className="h-4 w-4" />
              Demo Call
            </Button>

            <Button
              variant={isMuted ? 'destructive' : 'outline'}
              className="flex-1 flex items-center justify-center gap-2"
              onClick={handleToggleMute}
            >
              <Icon name={isMuted ? 'volume-mute' : 'volume-up'} className="h-4 w-4" />
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>
          </div>
        </div>

        {/* Transcripts Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm flex-1">
          <h2 className="text-lg font-semibold mb-4">Transcripts</h2>
          <TranscriptView botId={botId} />
        </div>
      </div>
    </div>
  );
}
