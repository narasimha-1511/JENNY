'use client';

import { useState, useEffect } from 'react';
import { AppointmentTool, BotAppointmentConfig } from '@/lib/types/appointment';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from '../ui/toggle';

interface BotAppointmentConfigProps {
  botId: string;
}

export function BotAppointmentConfig({ botId }: BotAppointmentConfigProps) {
  const [loading, setLoading] = useState(false);
  const [tools, setTools] = useState<AppointmentTool[]>([]);
  const [config, setConfig] = useState<BotAppointmentConfig | null>(null);
  const [isAppointmentEnabled, setIsAppointmentEnabled] = useState(false);
  const { toast } = useToast();


  useEffect(() => {
    const fetchData = async () => {

      const { data: botData } = await supabase
        .from('bots')
        .select('is_appointment_booking_allowed , appointment_tool_id')
        .eq('id', botId)
        .single();

      setIsAppointmentEnabled(botData?.is_appointment_booking_allowed);
      //@ts-ignore
      setConfig((prevConfig) =>  ({ ...prevConfig, tool_id: botData?.appointment_tool_id }));

      // Fetch available appointment tools
      const { data: toolsData } = await supabase
        .from('appointment_tools')
        .select('*');

      if (toolsData) {
        setTools(toolsData);
      }

      // Fetch bot's current configuration
      const { data: configData } = await supabase
        .from('bot_appointment_configs')
        .select('*')
        .eq('bot_id', botId)
        .single();

      if (configData) {
        setConfig(configData);
      }
    };

    fetchData();
  }, [botId]);

  const handleToolSelect = async (toolId: string) => {
    try {
      setLoading(true);

      //@ts-ignore
      setConfig((prevConfig) => ({ ...prevConfig, tool_id: toolId }));

      const { data } = await supabase
      .from('bots')
      .update({  appointment_tool_id: toolId })
      .eq('id', botId)
      .single();
      
      if (config) {
        // Update existing config
        const { error } = await supabase
          .from('bot_appointment_configs')
          .update({ tool_id: toolId })
          .eq('id', config.id);

        if (error) throw error;
      } else {
        // Create new config
        const { error } = await supabase
          .from('bot_appointment_configs')
          .insert([{
            bot_id: botId,
            tool_id: toolId,
            auto_confirm: false,
            reminder_enabled: true,
            reminder_hours_before: 24
          }]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Appointment configuration updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update appointment configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (field: keyof BotAppointmentConfig, value: boolean) => {
    if (!config) return;

    try {
      const { error } = await supabase
        .from('bot_appointment_configs')
        .update({ [field]: value })
        .eq('id', config.id);

      if (error) throw error;

      setConfig({ ...config, [field]: value });

      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  const handleAppointmentToggle = async (value: boolean) => {
    try {

      const { error } = await supabase
        .from('bots')
        .update({ is_appointment_booking_allowed: value })
        .eq('id', botId);

      if (error) throw error;

      setIsAppointmentEnabled(value); 

      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
      <div>

        <h3 className="text-lg font-medium mb-4">Appointment Settings <Switch className='ml-4 ' checked={isAppointmentEnabled} onCheckedChange={handleAppointmentToggle} /> </h3>
        
        <div className="space-y-4">
          <div>
            <Label>Select Appointment Tool</Label>
            <Select
              value={config?.tool_id}
              onValueChange={handleToolSelect}
              disabled={loading || !isAppointmentEnabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a tool"  />
              </SelectTrigger>
              <SelectContent>
                {tools.map((tool) => (
                  <SelectItem key={tool.id} value={tool.id}>
                    {tool.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {false && config && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-confirm Appointments</Label>
                  <p className="text-sm text-gray-500">
                    Automatically confirm appointments without review
                  </p>
                </div>
                <Switch
                  checked={config.auto_confirm}
                  onCheckedChange={(value) => handleToggle('auto_confirm', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Send Reminders</Label>
                  <p className="text-sm text-gray-500">
                    Call customers to remind them of upcoming appointments
                  </p>
                </div>
                <Switch
                  checked={config.reminder_enabled}
                  onCheckedChange={(value) => handleToggle('reminder_enabled', value)}
                />
              </div>

              {config.reminder_enabled && (
                <div>
                  <Label>Reminder Hours Before</Label>
                  <Select
                    value={config.reminder_hours_before.toString()}
                    onValueChange={(value) => handleToggle('reminder_hours_before', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hours" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 4, 8, 12, 24, 48].map((hours) => (
                        <SelectItem key={hours} value={hours.toString()}>
                          {hours} hours
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Custom Prompt (Optional)</Label>
                <Textarea
                  value={config.custom_prompt || ''}
                  onChange={async (e) => {
                    const { error } = await supabase
                      .from('bot_appointment_configs')
                      .update({ custom_prompt: e.target.value })
                      .eq('id', config.id);

                    if (!error) {
                      setConfig({ ...config, custom_prompt: e.target.value });
                    }
                  }}
                  placeholder="Custom prompt for the bot when handling appointments..."
                  className="mt-1"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
