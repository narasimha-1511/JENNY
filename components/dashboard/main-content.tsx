"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { BotList } from "./bot-list";
import { CreateBotForm } from "./create-bot-form";
import { BotDetails } from "./bot-details";
import { CalendarView } from "./calendar/calendar-view";

interface MainContentProps {
  user: any;
  showAiAssistant: boolean;
}

export function MainContent({ user, showAiAssistant }: MainContentProps) {
  const [selectedBotId, setSelectedBotId] = useState<string>();
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (!showAiAssistant) {
    return (
      <>
        <CalendarView />
        <br />
      </>
    );
  }

  return (
    <div className="flex h-full">
        {/* Left Sidebar - Bot List */}
        <div className="w-64 border-r border-gray-200 bg-white p-4">
          <Button
            onClick={() => setShowCreateForm(true)}
            className="w-full flex items-center gap-2 mb-4"
          >
            <Icon name="plus" className="h-4 w-4" />
            New Bot
          </Button>

          {showCreateForm ? (
            <CreateBotForm onClose={() => setShowCreateForm(false)} />
          ) : (
            <BotList onSelectBot={setSelectedBotId} />
          )}
        </div>

        {/* Main Area - Bot Details or Empty State */}
        <div className="flex-1 p-6 bg-gray-50">
          {selectedBotId ? (
            <BotDetails botId={selectedBotId} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a bot to view and edit details
            </div>
          )}
        </div>
      </div>
  );
}