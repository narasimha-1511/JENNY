"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { MainContent } from "./main-content";
import { Icon } from "@/components/ui/icons";

interface DashboardLayoutProps {
  user: any;
}

enum ContentView {
  Calendar = "calendar",
  AiAssistant = "ai-assistant",

}

export function DashboardLayout({ user }: DashboardLayoutProps) {
  const [showAiAssistant, setShowAiAssistant] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        showAiAssistant={showAiAssistant}
        onAiAssistantClick={() => setShowAiAssistant(true)}
        onCalendarClick={() => setShowAiAssistant(false)}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {showAiAssistant ? "AI Assistant" : "Calendar"}
              </h1>
              <div className="flex items-center gap-2">
                <Icon name="mail" className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">{user?.email}</span>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          <MainContent user={user} showAiAssistant={showAiAssistant} />
        </div>
      </div>
    </div>
  );
}