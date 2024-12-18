'use client';

import { useState, useEffect } from 'react';
import { AppointmentTool, BusinessHours, DaySchedule } from '@/lib/types/appointment';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Icon } from '@/components/ui/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AppointmentToolDetailsProps {
  toolId: string;
}

export function AppointmentToolDetails({ toolId }: AppointmentToolDetailsProps) {
  const [tool, setTool] = useState<AppointmentTool | null>(null);
  const [localTool, setLocalTool] = useState<AppointmentTool | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTool = async () => {
      const { data, error } = await supabase
        .from('appointment_tools')
        .select('*')
        .eq('id', toolId)
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch appointment tool details",
          variant: "destructive",
        });
      } else if (data) {
        setTool(data);
        setLocalTool(data);
      }
    };

    fetchTool();
  }, [toolId, toast]);

  const handleFieldChange = (field: string, value: any) => {
    setLocalTool(prev => prev ? { ...prev, [field]: value } : null);
    setHasChanges(true);
  };

  const handleBusinessHoursChange = (day: string, updates: Partial<DaySchedule>) => {
    if (!localTool?.business_hours) return;

    const newBusinessHours = {
      ...localTool.business_hours,
      [day]: {
        ...localTool.business_hours[day as keyof BusinessHours],
        ...updates
      }
    };

    setLocalTool(prev => prev ? { ...prev, business_hours: newBusinessHours } : null);
    setHasChanges(true);
  };

  const saveChanges = async () => {
    if (!localTool) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('appointment_tools')
        .update(localTool)
        .eq('id', toolId);

      if (error) throw error;

      setTool(localTool);
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Tool updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tool",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!localTool) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Icon name="loader" className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading tool details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-6">
        {/* Basic Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <h2 className="text-xl font-semibold">Tool Details</h2>
          
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={localTool.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={localTool.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="duration">Appointment Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={localTool.appointment_duration}
              onChange={(e) => handleFieldChange('appointment_duration', parseInt(e.target.value))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={localTool.location || ''}
              onChange={(e) => handleFieldChange('location', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Business Hours */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Business Hours</h2>
          
          <div className="space-y-4">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
              const daySchedule = localTool.business_hours[day as keyof BusinessHours];
              return (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-32">
                    <Label className="capitalize">{day}</Label>
                  </div>
                  
                  <Switch
                    checked={daySchedule.is_open}
                    onCheckedChange={(checked) => handleBusinessHoursChange(day, { is_open: checked })}
                  />

                  {daySchedule.is_open && (
                    <div className="flex items-center gap-2">
                      <Select
                        value={daySchedule.slots[0]?.start}
                        onValueChange={(value) => {
                          const newSlots = [{ ...daySchedule.slots[0], start: value }];
                          handleBusinessHoursChange(day, { slots: newSlots });
                        }}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="Start time" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }).map((_, i) => (
                            <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                              {`${i.toString().padStart(2, '0')}:00`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <span>to</span>

                      <Select
                        value={daySchedule.slots[0]?.end}
                        onValueChange={(value) => {
                          const newSlots = [{ ...daySchedule.slots[0], end: value }];
                          handleBusinessHoursChange(day, { slots: newSlots });
                        }}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="End time" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }).map((_, i) => (
                            <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                              {`${i.toString().padStart(2, '0')}:00`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Save Changes Button */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4">
          <Button 
            onClick={saveChanges} 
            disabled={loading}
            className="shadow-lg"
          >
            {loading ? (
              <>
                <Icon name="loader" className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Icon name="save" className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
