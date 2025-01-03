import { useBotStore } from "@/store/use-bot-store";
import { Bot } from "@/types/database";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useBots() {
    
    const bots = useBotStore((state) => state.bots);
    const selectedBotId = useBotStore((state) => state.selectedBotId);

    const [isLoading, setIsLoading] = useState<Boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBots = useCallback(async () => {
        const freshBots = useBotStore.getState().bots;
        if(freshBots && freshBots.length > 0) return;

        try {
            setIsLoading(true);
            setError(null);
            
            const { data, error } = await supabase
                .from("bots")
                .select("*")
                .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
                .order("created_at", { ascending: false });

            if (error) {
                setError(error.message);
                console.error("Error fetching bots:", error);
                return;
            }

            useBotStore.getState().setBots(data);
        } catch (error: any) {
            setError(error.message);
            console.error("Error fetching bots:", error);
        } finally {
            setIsLoading(false);
        }

    }, []);

    const setSelectedBotId = useCallback((botId: string | null) => {
        useBotStore.getState().setSelectedBotId(botId);
    }, []);

    const updateBot = useCallback((botId :string , bot : Bot) => {
        const updatedBots = bots.map((b) => {
            if (b.id === botId) {
                return bot;
            }
            return b;
        });
        useBotStore.getState().setBots(updatedBots);
    }, [bots]);

    useEffect(() => {
        fetchBots();
    }, []);

    return { bots, selectedBotId, isLoading, setSelectedBotId, error , updateBot };
}