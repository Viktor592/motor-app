// ═══════════════════════════════════════════════════
// МОТОР — Global Store (Zustand)
// Works on both React Native and Next.js
// ═══════════════════════════════════════════════════
import { create } from 'zustand';
import type {
  Client,
  Booking,
  BookingRequest,
  SpecialistType,
  Car,
  AgentActivity,
  WorkshopPost,
} from '../types';
import { bookingApi, clientApi, workshopApi, setToken, clearToken } from '../api';

// ── Auth Store ───────────────────────────────────
interface AuthState {
  client: Client | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setAuth: (token: string, client: Client) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  client: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setAuth: (token, client) => {
    setToken(token);
    set({ token, client, isAuthenticated: true, error: null });
  },

  logout: () => {
    clearToken();
    set({ token: null, client: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await clientApi.getMe();
      set({ client: data.data, isLoading: false });
    } catch {
      set({ error: 'Ошибка загрузки профиля', isLoading: false });
    }
  },
}));

// ── Booking Flow Store ───────────────────────────
// Tracks multi-step booking wizard state
interface BookingFlowState {
  specialistType: SpecialistType | null;
  car: Partial<Car>;
  complaint: string;
  selectedSlotId: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
  isSubmitting: boolean;
  lastCreated: Booking | null;
  error: string | null;

  setSpecialist: (type: SpecialistType) => void;
  setCar: (car: Partial<Car>) => void;
  setComplaint: (text: string) => void;
  setSlot: (slotId: string, date: string, time: string) => void;
  submit: (clientName: string, clientPhone: string) => Promise<Booking | null>;
  reset: () => void;
}

const initialFlowState = {
  specialistType: null,
  car: {},
  complaint: '',
  selectedSlotId: null,
  selectedDate: null,
  selectedTime: null,
  isSubmitting: false,
  lastCreated: null,
  error: null,
};

export const useBookingFlowStore = create<BookingFlowState>((set, get) => ({
  ...initialFlowState,

  setSpecialist: (type) => set({ specialistType: type }),
  setCar: (car) => set((s) => ({ car: { ...s.car, ...car } })),
  setComplaint: (text) => set({ complaint: text }),
  setSlot: (slotId, date, time) =>
    set({ selectedSlotId: slotId, selectedDate: date, selectedTime: time }),

  submit: async (clientName, clientPhone) => {
    const s = get();
    if (!s.specialistType || !s.selectedSlotId || !s.car.make || !s.complaint) {
      set({ error: 'Заполните все обязательные поля' });
      return null;
    }

    set({ isSubmitting: true, error: null });

    const payload: BookingRequest = {
      specialistType: s.specialistType,
      carMake: s.car.make ?? '',
      carModel: s.car.model ?? '',
      carYear: s.car.year ?? new Date().getFullYear(),
      mileage: s.car.mileage,
      vin: s.car.vin,
      complaint: s.complaint,
      slotId: s.selectedSlotId,
      clientName,
      clientPhone,
    };

    try {
      const { data } = await bookingApi.createBooking(payload);
      set({ lastCreated: data.data, isSubmitting: false });
      return data.data;
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Ошибка при создании записи';
      set({ error: msg, isSubmitting: false });
      return null;
    }
  },

  reset: () => set(initialFlowState),
}));

// ── My Bookings Store ────────────────────────────
interface MyBookingsState {
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  cancelBooking: (id: string, reason: string) => Promise<void>;
}

export const useMyBookingsStore = create<MyBookingsState>((set, get) => ({
  bookings: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await bookingApi.getMyBookings();
      set({ bookings: data.data, isLoading: false });
    } catch {
      set({ error: 'Ошибка загрузки заказов', isLoading: false });
    }
  },

  cancelBooking: async (id, reason) => {
    try {
      const { data } = await bookingApi.cancelBooking(id, reason);
      set((s) => ({
        bookings: s.bookings.map((b) => (b.id === id ? data.data : b)),
      }));
    } catch {
      set({ error: 'Не удалось отменить запись' });
    }
  },
}));

// ── Workshop Posts Store ─────────────────────────
interface PostsState {
  posts: WorkshopPost[];
  fetch: () => Promise<void>;
}

export const usePostsStore = create<PostsState>((set) => ({
  posts: [],
  fetch: async () => {
    try {
      const { data } = await workshopApi.getPosts();
      set({ posts: data.data });
    } catch { /* silent */ }
  },
}));

// ── Agent Activity Store ─────────────────────────
interface AgentState {
  activities: AgentActivity[];
  push: (activity: AgentActivity) => void;
  clear: () => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  activities: [],
  push: (activity) =>
    set((s) => ({ activities: [activity, ...s.activities].slice(0, 20) })),
  clear: () => set({ activities: [] }),
}));
