'use client';

import { useEffect, useState } from 'react';
import { Bot } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icons';

interface BotListProps {
  onSelectBot: (botId: string) => void;
}

export function BotList({ onSelectBot }: BotListProps) {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>();

  useEffect(() => {
    const fetchBots = async () => {
      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBots(data);
      }
    };

    fetchBots();

    const channel = supabase
      .channel('bot_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bots' },
        () => {
          fetchBots();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleBotSelect = (botId: string) => {
    setSelectedBotId(botId);
    onSelectBot(botId);
  };

  return (
    <div className="space-y-2">
      {bots.map((bot) => (
        <Button
          key={bot.id}
          variant={selectedBotId === bot.id ? 'default' : 'ghost'}
          className="w-full justify-start gap-2 text-left"
          onClick={() => handleBotSelect(bot.id)}
        >
          <Icon name="bot" className="h-4 w-4" />
          <span className="truncate">{bot.name}</span>
        </Button>
      ))}
    </div>
  );
}