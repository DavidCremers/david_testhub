import { create } from 'zustand';
import type { CalendarEvent, CalendarEventCreate, CalendarEventUpdate } from '../shared';
import {
  getEvents,
  getTodayEvents,
  getEventsInRange,
  getEventsForDay,
  createEvent as apiCreateEvent,
  updateEvent as apiUpdateEvent,
  deleteEvent as apiDeleteEvent,
} from '../shared';

interface EventsState {
  events: CalendarEvent[];
  todayEvents: CalendarEvent[];
  selectedDateEvents: CalendarEvent[];
  selectedDate: Date | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadEvents: (workspaceId: string) => Promise<void>;
  loadTodayEvents: (workspaceId: string) => Promise<void>;
  loadEventsForDate: (workspaceId: string, date: Date) => Promise<void>;
  loadEventsInRange: (workspaceId: string, startDate: Date, endDate: Date) => Promise<void>;
  setSelectedDate: (date: Date | null) => void;
  createEvent: (event: CalendarEventCreate) => Promise<CalendarEvent>;
  updateEvent: (id: string, update: CalendarEventUpdate) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  clearEvents: () => void;
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  todayEvents: [],
  selectedDateEvents: [],
  selectedDate: null,
  isLoading: false,
  error: null,

  loadEvents: async (workspaceId: string) => {
    try {
      set({ isLoading: true, error: null });
      const events = await getEvents(workspaceId);
      set({ events, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load events',
      });
    }
  },

  loadTodayEvents: async (workspaceId: string) => {
    try {
      const todayEvents = await getTodayEvents(workspaceId);
      set({ todayEvents });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load today events',
      });
    }
  },

  loadEventsForDate: async (workspaceId: string, date: Date) => {
    try {
      set({ isLoading: true, error: null });
      const selectedDateEvents = await getEventsForDay(workspaceId, date);
      set({ selectedDateEvents, selectedDate: date, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load events for date',
      });
    }
  },

  loadEventsInRange: async (workspaceId: string, startDate: Date, endDate: Date) => {
    try {
      set({ isLoading: true, error: null });
      const events = await getEventsInRange(workspaceId, startDate, endDate);
      set({ events, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load events in range',
      });
    }
  },

  setSelectedDate: (date: Date | null) => {
    set({ selectedDate: date });
  },

  createEvent: async (event: CalendarEventCreate) => {
    try {
      set({ isLoading: true, error: null });
      const newEvent = await apiCreateEvent(event);

      set((state) => ({
        events: [...state.events, newEvent].sort(
          (a, b) => a.startTime.getTime() - b.startTime.getTime()
        ),
        isLoading: false,
      }));

      // Reload today events if needed
      get().loadTodayEvents(event.workspaceId);

      return newEvent;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create event',
      });
      throw error;
    }
  },

  updateEvent: async (id: string, update: CalendarEventUpdate) => {
    try {
      set({ isLoading: true, error: null });
      const updatedEvent = await apiUpdateEvent(id, update);

      set((state) => ({
        events: state.events
          .map((e) => (e.id === id ? updatedEvent : e))
          .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
        todayEvents: state.todayEvents.map((e) => (e.id === id ? updatedEvent : e)),
        selectedDateEvents: state.selectedDateEvents.map((e) =>
          e.id === id ? updatedEvent : e
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update event',
      });
      throw error;
    }
  },

  deleteEvent: async (id: string) => {
    try {
      await apiDeleteEvent(id);

      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
        todayEvents: state.todayEvents.filter((e) => e.id !== id),
        selectedDateEvents: state.selectedDateEvents.filter((e) => e.id !== id),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete event',
      });
      throw error;
    }
  },

  clearEvents: () => {
    set({
      events: [],
      todayEvents: [],
      selectedDateEvents: [],
      selectedDate: null,
      error: null,
    });
  },
}));
