"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { EventModal } from "./event-modal";
import { supabase } from "@/lib/supabase";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "@/styles/calendar.css";

const locales = {
  "en-US": require("date-fns/locale/en-US"),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export function CalendarView() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calendarAccounts, setCalendarAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [integrating, setIntegrating] = useState(false);
  const [view, setView] = useState("month");
  const [date, setDate] = useState(new Date());
  const [selectedCalendar, setSelectedCalendar] = useState<string | null>(null);
  const [eventData, setEventData] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCalendarAccounts();
  }, []);

  useEffect(() => {
    if (calendarAccounts?.length > 0 && !selectedCalendar) {
      setSelectedCalendar(calendarAccounts[0].id);
    }
  }, [calendarAccounts, selectedCalendar]);

  const fetchCalendarAccounts = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("user_calendar_accounts")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setCalendarAccounts(data || []);

      if (data?.length > 0) {
        await fetchEvents(data);
      }
    } catch (error) {
      console.error("Error fetching calendar accounts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch calendar accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async (accounts) => {
    try {
      const allEvents = [];
      for (const account of accounts) {
        console.log("Fetching events for account:", account.calendar_email);

        // Get events for a reasonable time range (1 year before and after current date)
        const timeMin = new Date();
        timeMin.setFullYear(timeMin.getFullYear() - 1);
        const timeMax = new Date();
        timeMax.setFullYear(timeMax.getFullYear() + 1);

        const url = `/api/calendar/events?accountId=${
          account.id
        }&timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}`;
        console.log("Fetching from URL:", url);

        const response = await fetch(url);

        if (!response.ok) {
          const error = await response.text();
          console.error("Failed to fetch events:", error);
          continue; // Skip this account and try the next one
        }

        const events = await response.json();
        console.log("Received events:", events);

        const parsedEvents = events
          .map((event) => {
            try {
              const start = event.start.dateTime
                ? new Date(event.start.dateTime)
                : new Date(event.start.date);
              const end = event.end.dateTime
                ? new Date(event.end.dateTime)
                : new Date(event.end.date);

              return {
                id: event.id,
                title: event.summary || "Untitled Event",
                start,
                end,
                calendarId: account.id,
                description: event.description,
                location: event.location,
              };
            } catch (error) {
              console.error("Error parsing event:", error, event);
              return null;
            }
          })
          .filter(Boolean); // Remove any null events

        allEvents.push(...parsedEvents);
      }

      setEvents(allEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive",
      });
    }
  };

  const handleEventCreate = async (eventData: any) => {
    const calendarId = eventData.calendarId || selectedCalendar;

    if (!calendarId) {
      toast({
        title: "Error",
        description: "Please select a calendar first",
        variant: "destructive",
      });
      return;
    }

    try {
      const formattedEvent = {
        summary: eventData.summary,
        description: eventData.description,
        start: eventData.start,
        end: eventData.end,
      };

      const response = await fetch(
        `/api/calendar/events?accountId=${calendarId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ event: formattedEvent }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 429) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Please wait a moment and try again",
            variant: "destructive",
          });
          return;
        }
        throw new Error(error.message || "Failed to create event");
      }

      const newEvent = await response.json();

      // Add the new event to the local state immediately
      const parsedEvent = {
        id: newEvent.id,
        title: newEvent.summary || "Untitled Event",
        start: new Date(newEvent.start.dateTime),
        end: new Date(newEvent.end.dateTime),
        calendarId: calendarId,
        description: newEvent.description,
      };

      setEvents((prevEvents) => [...prevEvents, parsedEvent]);

      toast({
        title: "Success",
        description: "Event created successfully",
      });

      // Refresh events in the background
      fetchEvents(calendarAccounts).catch(console.error);

      return newEvent;
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleEventDelete = async (event: any) => {
    if (!selectedCalendar) {
      toast({
        title: "Error",
        description: "Please select a calendar first",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/calendar/events/${event.id}?accountId=${selectedCalendar}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ eventId: event.id }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 429) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Please wait a moment and try again",
            variant: "destructive",
          });
          return;
        }
        throw new Error(error.message || "Failed to delete event");
      }

      // Refresh events
      await fetchEvents(calendarAccounts);

      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleEventEdit = async (eventData: any) => {
    console.log("Editing event:", eventData);
    try {
      setLoading(true);
      const formattedEvent = {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: new Date(eventData.start).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: new Date(eventData.end).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };

      const response = await fetch(
        `/api/calendar/events/${eventData.id}?accountId=${selectedCalendar}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ event: formattedEvent }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 429) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Please wait a moment and try again",
            variant: "destructive",
          });
          return;
        }
        throw new Error(error.message || "Failed to update event");
      }

      const updatedEvent = await response.json();
      console.log("Event updated:", updatedEvent);

      // Refresh events
      await fetchEvents(calendarAccounts);

      toast({
        title: "Success",
        description: "Event updated successfully",
      });

      return updatedEvent;
    } catch (error: any) {
      console.error("Error updating event:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      if (!selectedCalendar) {
        toast({
          title: "Error",
          description: "Please select a calendar first",
          variant: "destructive",
        });
        return;
      }

      if (loading) {
        toast({
          title: "Please wait",
          description: "Another operation is in progress",
          variant: "destructive",
        });
        return;
      }

      setSelectedEvent(null);
      setIsModalOpen(true);
      setEventData({
        start,
        end,
        calendarId: selectedCalendar,
      });
    },
    [selectedCalendar, loading, toast]
  );

  const handleEventModalSave = async (eventData: any) => {
    try {
      if (loading) {
        toast({
          title: "Please wait",
          description: "Another operation is in progress",
          variant: "destructive",
        });
        return;
      }

      if (selectedEvent?.id) {
        await handleEventEdit(eventData);
      } else {
        await handleEventCreate(eventData);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving event:", error);
      // Error is already handled in the respective functions
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleAddCalendar = async () => {
    setIntegrating(true);
    try {
      const response = await fetch("/api/calendar/auth-url");
      const { url } = await response.json();
      if (url && typeof window !== "undefined") {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error getting auth URL:", error);
      toast({
        title: "Error",
        description: "Failed to start calendar authentication",
        variant: "destructive",
      });
      setIntegrating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">Loading...</div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 p-4 border-b">
        <div className="flex items-center gap-4">
          {calendarAccounts.length > 0 && (
            <select
              value={selectedCalendar || ""}
              onChange={(e) => setSelectedCalendar(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm"
            >
              {calendarAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.calendar_email}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2">
          {calendarAccounts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date();
                handleSelectSlot({
                  start: now,
                  end: new Date(now.getTime() + 60 * 60 * 1000),
                });
              }}
              className="flex items-center gap-2"
            >
              <Icon name="plus" className="h-4 w-4" />
              New Event
            </Button>
          )}
          <Button
            onClick={handleAddCalendar}
            size="sm"
            className="flex items-center gap-2"
            disabled={integrating}
          >
            {integrating ? (
              <>
                <Icon name="loader2" className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Icon name="calendar-plus" className="h-4 w-4" />
                Add Calendar
              </>
            )}
          </Button>
        </div>
      </div>

      {calendarAccounts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Icon name="calendar" className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="text-lg font-medium">No calendars connected</h3>
            <p className="text-gray-500 max-w-sm">
              Connect your Google Calendar to start managing your events in one
              place.
            </p>
            <Button
              onClick={handleAddCalendar}
              className="flex items-center gap-2"
              disabled={integrating}
            >
              {integrating ? (
                <>
                  <Icon name="loader2" className="h-4 w-4 animate-spin" />
                  Connecting to Google Calendar...
                </>
              ) : (
                <>
                  <Icon name="calendar-plus" className="h-4 w-4" />
                  Connect Google Calendar
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-4">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            onSelectSlot={handleSelectSlot}
            onSelectEvent={(event) => {
              setSelectedEvent(event);
              setIsModalOpen(true);
              setSelectedCalendar(event.calendarId);
            }}
            selectable
            style={{ height: "calc(100% - 16px)" }}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            defaultView="month"
            views={["month", "week", "day"]}
            popup
            toolbar={true}
            min={new Date(0, 0, 0, 6, 0, 0)} // Start at 6 AM
            max={new Date(0, 0, 0, 23, 59, 59)} // End at midnight
            eventPropGetter={(event) => ({
              style: {
                backgroundColor: "#2563eb",
                borderRadius: "4px",
                color: "white",
                border: "none",
              },
            })}
          />

          {isModalOpen && (
            <EventModal
              event={selectedEvent}
              calendarAccounts={calendarAccounts}
              onClose={handleModalClose}
              onSave={handleEventModalSave}
              onDelete={handleEventDelete}
              eventData={eventData}
            />
          )}
        </div>
      )}
    </div>
  );
}
