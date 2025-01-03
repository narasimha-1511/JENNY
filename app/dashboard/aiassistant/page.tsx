"use client"
import { BotDetails } from '@/components/ai-assistants/bot-details';
import { BotList } from '@/components/ai-assistants/bot-list';
import { CreateBotForm } from '@/components/dashboard/create-bot-form';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icons';
import { useUser } from '@/hooks/use-user';
import React , { useState } from 'react'
import { useBots } from '@/hooks/use-bots';

const page = () => {
  const { user } = useUser();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { selectedBotId } = useBots();

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Bot List */}
      <div className="w-64 border-r border-gray-200 bg-white p-4 overflow-y-auto">
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
          <BotList />
        )}
      </div>

      {/* Main Area - Bot Details or Empty State */}
      <div className="flex-1 p-6 bg-gray-50">
        {selectedBotId ? (
          <BotDetails />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a bot to view and edit details
          </div>
        )}
      </div>
    </div>
  )
}

export default page