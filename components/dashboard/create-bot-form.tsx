'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(1, 'Bot name is required'),
  phone_number: z.string().optional(),
  voice: z.string().min(1, 'Please select a voice'),
  system_prompt: z.string().min(1, 'System prompt is required'),
});

type FormData = z.infer<typeof formSchema>;

interface CreateBotFormProps {
  onClose: () => void;
}

export function CreateBotForm({ onClose }: CreateBotFormProps) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone_number: '',
      voice: '',
      system_prompt: '',
    }
  });
  const { toast } = useToast();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Insert bot with user_id
      const { error } = await supabase.from('bots').insert([{
        ...data,
        user_id: user.id
      }]);
      
      if (error) {
        toast({
          title: 'Error creating bot',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'Bot created successfully',
      });
      
      onClose();
    } catch (error) {
      console.error('Error creating bot:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create bot',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedVoice = watch('voice');

  return (
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
            <SelectItem value="alloy">Alloy</SelectItem>
            <SelectItem value="echo">Echo</SelectItem>
            <SelectItem value="fable">Fable</SelectItem>
            <SelectItem value="onyx">Onyx</SelectItem>
            <SelectItem value="nova">Nova</SelectItem>
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

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Bot'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}