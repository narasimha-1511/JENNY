'use client';

import { useState } from 'react';
import { AppointmentToolList } from '@/components/appointment-tools/appointment-tool-list';
import { CreateAppointmentTool } from '@/components/appointment-tools/create-appointment-tool';
import { AppointmentToolDetails } from '@/components/appointment-tools/appointment-tool-details';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icons';

export default function AppointmentToolsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);

  const handleToolSelect = (toolId: string) => {
    setSelectedToolId(toolId);
    setShowCreateForm(false);
  };

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Tool List */}
      <div className="w-64 border-r border-gray-200 bg-white p-4 overflow-y-auto h-full">
        <Button
          onClick={() => {
            setShowCreateForm(true);
            setSelectedToolId(null);
          }}
          className="w-full flex items-center gap-2 mb-4"
        >
          <Icon name="plus" className="h-4 w-4" />
          New Appointment Tool
        </Button>

        {showCreateForm ? (
          <CreateAppointmentTool onClose={() => setShowCreateForm(false)} />
        ) : (
          <AppointmentToolList onSelectTool={handleToolSelect} selectedToolId={selectedToolId} />
        )}
      </div>

      {/* Main Area - Tool Details or Empty State */}
      <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
        {selectedToolId ? (
          <AppointmentToolDetails toolId={selectedToolId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            {showCreateForm ? (
              <p>Fill out the form to create a new appointment tool</p>
            ) : (
              <p>Select an appointment tool to view and edit details</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
