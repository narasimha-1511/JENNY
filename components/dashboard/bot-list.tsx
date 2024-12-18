'use client';

import { useEffect, useState } from 'react';
import { Bot } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icons';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BotListProps {
  onSelectBot: (botId: string) => void;
}

export function BotList({ onSelectBot }: BotListProps) {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>();
  const { toast } = useToast();

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

  const handleDeleteBot = async (botId: string) => {
    try {
      const { error } = await supabase
        .from('bots')
        .delete()
        .eq('id', botId);

      if (error) throw error;

      toast({
        title: "Bot deleted",
        description: "The bot has been successfully deleted.",
      });

      if (selectedBotId === botId) {
        setSelectedBotId(undefined);
        onSelectBot('');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the bot. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      {bots.map((bot) => (
        <div
          key={bot.id}
          className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 flex justify-between items-center ${
            selectedBotId === bot.id ? 'bg-gray-100' : ''
          }`}
        >
          <div
            className="flex-1"
            onClick={() => handleBotSelect(bot.id)}
          >
            <div className="flex items-center gap-2">
            <Icon name="bot" className="h-3 w-3" />
            <h3 className="font-medium">{bot.name}</h3>
            </div>
            {bot.phone_number && (
              <p className="text-sm text-gray-500">{bot.phone_number}</p>
            )}
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <Icon name="trash" className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Bot</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this bot? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDeleteBot(bot.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
      
      {bots.length === 0 && (
        <div className="text-center text-gray-500 py-4">
          No bots found. Create one to get started.
        </div>
      )}
    </div>
  );
}