'use client';

import { useEffect, useState, memo, useCallback } from 'react';
import { Bot } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { Icon } from '@/components/ui/icons';
import { useToast } from '@/hooks/use-toast';

interface BotItemProps {
  bot: Bot;
  isSelected: boolean;
  onSelect: (botId: string) => void;
}

interface Bot {
  id: string;
  name: string;
  phone_number?: string;
  voice: string;
  system_prompt: string;
}

const BotItem = memo(function BotItem({ bot, isSelected, onSelect }: BotItemProps) {
  return (
    <button
      className={`w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors ${
        isSelected ? 'bg-gray-100' : ''
      }`}
      onClick={() => onSelect(bot.id)}
    >
      <div className="flex items-center gap-3">
        <Icon name="bot" className="h-5 w-5 text-gray-500" />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{bot.name}</div>
          {bot.phone_number && (
            <div className="text-sm text-gray-500 truncate">{bot.phone_number}</div>
          )}
        </div>
      </div>
    </button>
  );
});

interface BotListProps {
  onSelectBot: (botId: string) => void;
}

export function BotList({ onSelectBot }: BotListProps) {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleSelectBot = useCallback((botId: string) => {
    setSelectedBotId(botId);
    onSelectBot(botId);
  }, [onSelectBot]);

  useEffect(() => {
    const fetchBots = async () => {
      try {
        const { data, error } = await supabase
          .from('bots')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setBots(data || []);
      } catch (error) {
        console.error('Error fetching bots:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch bots',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBots();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('bots_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bots' }, (payload) => {
        fetchBots();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [toast]);

  if (loading) {
    return <div className="p-4 text-gray-500">Loading bots...</div>;
  }

  if (bots.length === 0) {
    return <div className="p-4 text-gray-500">No bots found. Create one to get started!</div>;
  }

  return (
    <div className="space-y-2">
      {bots.map((bot) => (
        <BotItem
          key={bot.id}
          bot={bot}
          isSelected={bot.id === selectedBotId}
          onSelect={handleSelectBot}
        />
      ))}
    </div>
  );
}