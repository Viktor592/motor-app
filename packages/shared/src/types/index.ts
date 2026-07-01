// Роли пользователей
export type UserRole = 'CLIENT' | 'ADMIN' | 'MASTER' | 'STAFF';

// Статусы заказа
export type OrderStatus = 'NEW' | 'ASSESSED' | 'CONFIRMED' | 'IN_PROGRESS' | 'READY' | 'CLOSED' | 'CANCELLED';

// Авторизация
export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: AuthUser;
}

// Заказ
export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  specialistType: string;
  complaintRaw: string;
  totalRetail: number | null;
  createdAt: string;
  client?: { name: string; phone: string };
  vehicle?: { brand: string; model: string; year: number; plateNum: string | null };
  master?: { name: string } | null;
}

// Сообщение чата
export interface ChatMessage {
  id: string;
  orderId: string;
  role: 'CLIENT' | 'MASTER' | 'AI' | 'ADMIN';
  content: string;
  createdAt: string;
  sender?: { name: string };
}

// URL-ы приложений (передаются через env)
export interface AppUrls {
  saas:       string;
  admin:      string;
  clientWeb:  string;
  staffWeb:   string;
}
