'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BotList } from './bot-list';
import { CreateBotForm } from './create-bot-form';
import { TwilioIntegration } from './twilio-integration';

export function Sidebar({ onSelectBot }: { onSelectBot: (botId: string) => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTwilioIntegration, setShowTwilioIntegration] = useState(false);

  return (
    <div
      className={cn(
        'h-screen bg-white border-r border-gray-200 transition-all duration-300',
        collapsed ? 'w-16' : 'w-80'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && <h2 className="text-lg font-semibold">AI Assistants</h2>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn('ml-auto', collapsed && 'rotate-180')}
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
        </Button>
      </div>

      {!collapsed && (
        <div className="p-4">
          <Button
            onClick={() => setShowCreateForm(true)}
            className="w-full flex items-center gap-2"
          >
            <Icon name="plus" className="h-4 w-4" />
            New Assistant
          </Button>
          <Button
            onClick={() => setShowTwilioIntegration(!showTwilioIntegration)}
            className="w-full flex items-center gap-2 mt-4"
          >
            <Icon name="phone" className="h-4 w-4" />
            Twilio Integration
          </Button>
          {showTwilioIntegration && <TwilioIntegration />}
        </div>
      )}

      {collapsed ? (
        <div className="p-4">
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <Icon name="bot" className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="p-4">
          {showCreateForm ? (
            <CreateBotForm onClose={() => setShowCreateForm(false)} />
          ) : (
            <BotList onSelectBot={onSelectBot} />
          )}
        </div>
      )}
    </div>
  );
}