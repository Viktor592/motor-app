// ═══════════════════════════════════════════════════
// МОТОР — API Client
// ═══════════════════════════════════════════════════
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  BookingRequest,
  Booking,
  TimeSlot,
  WorkshopPost,
  DiagResult,
  Client,
  SpecialistType,
} from '../types';

// ── Base URL — swap via env ──────────────────────
export const API_BASE_URL =
  process.env.MOTOR_API_URL ?? 'https://api.motor-auto.ru/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Auth token injection ─────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Global error handler ─────────────────────────
apiClient.interceptors.response.use(
  (r) => r,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      clearToken();
      // Emit event — mobile and web handle navigation differently
      tokenExpiredEmitter();
    }
    return Promise.reject(err);
  }
);

// Stubs — replaced by platform-specific storage
let _token: string | null = null;
export const setToken = (t: string) => { _token = t; };
export const getToken = () => _token;
export const clearToken = () => { _token = null; };
export let tokenExpiredEmitter = () => {};
export const setTokenExpiredHandler = (fn: () => void) => { tokenExpiredEmitter = fn; };

// ═══════════════════════════════════════════════════
// API METHODS
// ═══════════════════════════════════════════════════

// ── Auth ─────────────────────────────────────────
export const authApi = {
  requestOtp: (phone: string) =>
    apiClient.post<ApiResponse<void>>('/auth/otp', { phone }),

  verifyOtp: (phone: string, code: string) =>
    apiClient.post<ApiResponse<{ token: string; client: Client }>>('/auth/verify', { phone, code }),
};

// ── Booking ──────────────────────────────────────
export const bookingApi = {
  getSlots: (params: { date: string; specialistType: SpecialistType }) =>
    apiClient.get<ApiResponse<TimeSlot[]>>('/slots', { params }),

  getSlotsRange: (params: { from: string; to: string; specialistType: SpecialistType }) =>
    apiClient.get<ApiResponse<TimeSlot[]>>('/slots/range', { params }),

  createBooking: (payload: BookingRequest) =>
    apiClient.post<ApiResponse<Booking>>('/bookings', payload),

  getBooking: (id: string) =>
    apiClient.get<ApiResponse<Booking>>(`/bookings/${id}`),

  getMyBookings: () =>
    apiClient.get<ApiResponse<Booking[]>>('/bookings/my'),

  cancelBooking: (id: string, reason: string) =>
    apiClient.patch<ApiResponse<Booking>>(`/bookings/${id}/cancel`, { reason }),
};

// ── Workshop ─────────────────────────────────────
export const workshopApi = {
  getPosts: () =>
    apiClient.get<ApiResponse<WorkshopPost[]>>('/workshop/posts'),
};

// ── Diagnostics ──────────────────────────────────
export const diagApi = {
  getResult: (bookingId: string) =>
    apiClient.get<ApiResponse<DiagResult>>(`/diagnostics/${bookingId}`),
};

// ── Client ───────────────────────────────────────
export const clientApi = {
  getMe: () =>
    apiClient.get<ApiResponse<Client>>('/clients/me'),

  updateProfile: (data: Partial<Pick<Client, 'name' | 'email'>>) =>
    apiClient.patch<ApiResponse<Client>>('/clients/me', data),
};
