// ═══════════════════════════════════════════════════
// МОТОР — Core Types
// Shared between mobile (React Native) and web (Next.js)
// ═══════════════════════════════════════════════════

// ── Specialists ──────────────────────────────────
export type SpecialistType = 'mechanic' | 'electrician' | 'diagnostics';

export interface Specialist {
  id: string;
  type: SpecialistType;
  name: string;
  post: number;
  rating: number;
  competencies: string[];
  avatarUrl?: string;
}

// ── Booking ──────────────────────────────────────
export type BookingStatus =
  | 'new'
  | 'estimated'
  | 'confirmed'
  | 'in_progress'
  | 'ready'
  | 'closed'
  | 'cancelled';

export interface TimeSlot {
  id: string;
  date: string;          // ISO date string  "2025-01-14"
  time: string;          // "10:00"
  postNumber: number;
  specialistId: string;
  available: boolean;
}

export interface BookingRequest {
  specialistType: SpecialistType;
  carMake: string;
  carModel: string;
  carYear: number;
  mileage?: number;
  vin?: string;
  complaint: string;
  slotId: string;
  clientName: string;
  clientPhone: string;
}

export interface Booking {
  id: string;
  orderNumber: string;    // "ЗН-2025-0847"
  status: BookingStatus;
  specialistType: SpecialistType;
  specialist?: Specialist;
  car: Car;
  complaint: string;
  slotDate: string;
  slotTime: string;
  postNumber: number;
  estimateMin?: number;
  estimateMax?: number;
  totalRetail?: number;
  createdAt: string;
  updatedAt: string;
}

// ── Car ──────────────────────────────────────────
export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage?: number;
  vin?: string;
  plateNumber?: string;
}

// ── Client ───────────────────────────────────────
export interface Client {
  id: string;
  name: string;
  phoneMasked: string;   // "+7 (9**) ***-**-12"
  email?: string;
  cars: Car[];
  bookings: Booking[];
}

// ── AI Agents ────────────────────────────────────
export type AgentType =
  | 'receiver'
  | 'estimator'
  | 'diagnostician'
  | 'supplier'
  | 'planner'
  | 'accountant';

export interface AgentActivity {
  agent: AgentType;
  status: 'idle' | 'working' | 'done' | 'error';
  message: string;
  timestamp: string;
}

// ── Diagnostics ──────────────────────────────────
export interface DiagHypothesis {
  rank: number;
  title: string;
  probability: number;   // 0–100
  checks: string[];
  parts: DiagPart[];
}

export interface DiagPart {
  article: string;
  name: string;
  isOem: boolean;
  retailPrice: number;
}

export interface DiagResult {
  bookingId: string;
  hypotheses: DiagHypothesis[];
  generatedAt: string;
  approvedByMaster: boolean;
}

// ── Posts / Workshop ─────────────────────────────
export interface WorkshopPost {
  id: number;
  name: string;
  type: SpecialistType;
  slotsTotal: number;
  slotsFree: number;
}

// ── API Response wrappers ────────────────────────
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

// ── Navigation (used to sync route names) ────────
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Booking: undefined;
  MyOrders: undefined;
  Profile: undefined;
};

export type BookingStackParamList = {
  SelectSpecialist: undefined;
  CarInfo: { specialistType: SpecialistType };
  Complaint: { specialistType: SpecialistType; car: Partial<Car> };
  SelectSlot: { specialistType: SpecialistType; car: Partial<Car>; complaint: string };
  Confirm: { request: BookingRequest };
  Success: { orderNumber: string; slotDate: string; slotTime: string };
};
