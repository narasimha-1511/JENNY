"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { CreateBotForm } from "@/components/create-bot-form";
import { AIAssistant } from "./ai-assistant/ai-assistant";
import { CalendarView } from "./calendar/calendar-view";

// Define the possible views/routes
type ContentView = "dashboard" | "bots" | "calendar" | "settings";

interface MainContentProps {
  user: any;
  activeView?: ContentView;
}

export function MainContent({
  user,
  activeView = "dashboard",
}: MainContentProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Render content based on active view
  const renderContent = () => {
    switch (activeView) {
      case "bots":
        return (
          <div className="p-6">
            {showCreateForm ? (
              <div className="max-w-2xl mx-auto">
                <CreateBotForm onClose={() => setShowCreateForm(false)} />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold">My Bots</h2>
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center gap-2"
                  >
                    <Icon name="plus" className="h-4 w-4" />
                    Create New Bot
                  </Button>
                </div>
                {/* Add your bot list component here */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Bot cards will go here */}
                </div>
              </div>
            )}
          </div>
        );

      case "calendar":
        return <CalendarView />;

      case "settings":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Settings</h2>
            {/* Add your settings component here */}
          </div>
        );

      default: // dashboard
        return (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Dashboard stats/cards */}
              <DashboardCard
                title="Total Bots"
                value="0"
                icon="robot"
                trend="+0%"
              />
              <DashboardCard
                title="Active Sessions"
                value="0"
                icon="users"
                trend="0%"
              />
              <DashboardCard
                title="Messages"
                value="0"
                icon="message-square"
                trend="0%"
              />
            </div>

            <div className="mt-8">
              <AIAssistant user={user} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Icon name="mail" className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-gray-50">{renderContent()}</main>
    </div>
  );
}

// Dashboard Card Component
interface DashboardCardProps {
  title: string;
  value: string;
  icon: string;
  trend: string;
}

function DashboardCard({ title, value, icon, trend }: DashboardCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-full">
          <Icon name={icon} className="h-6 w-6 text-gray-600" />
        </div>
      </div>
      <div className="mt-4">
        <span className="text-sm font-medium text-gray-600">
          {trend} from last month
        </span>
      </div>
    </div>
  );
}
