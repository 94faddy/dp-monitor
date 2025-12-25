// User types
export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
  status: 'active' | 'inactive' | 'banned';
  last_login: string | null;
  created_at: string;
}

export interface UserSession {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
}

// Database types
export interface UserDatabase {
  id: number;
  user_id: number;
  name: string;
  note: string | null;
  host: string;
  port: number;
  db_user: string;
  db_password: string;
  db_name: string;
  table_name: string;
  is_active: boolean;
  last_connected: string | null;
  created_at: string;
}

export interface DatabaseConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  table: string;
  createdAt: string;
}

export interface DatabasesData {
  databases: DatabaseConfig[];
}

export interface Transaction {
  id: number;
  username: string;
  timestamp: string;
  web_bank: number | null;
  ref_id: string | null;
  amount_before: number | null;
  amount: number;
  bonus: number | null;
  clear: number | null;
  amount_after: number | null;
  promotion: number | null;
  type_tran: 'deposit' | 'withdraw';
  admin: string | null;
  note: string | null;
  tmw: number; // 1 = TrueMoney, -6 = PromptPay/Bank, 0 = Manual
  isAuto: number; // 1 = Auto, 0 = Manual
  status: number; // 1 = Success, 0 = Pending
}

export interface TransactionSummary {
  totalAmount: number;
  totalCount: number;
  successCount: number;
  pendingCount: number;
  averageAmount: number;
  autoCount: number;
  manualCount: number;
  bankCount: number;
  truemoneyCount: number;
  bankAmount: number;
  truemoneyAmount: number;
}

export interface DateFilter {
  startDate?: string;
  endDate?: string;
}

export type TransactionType = 'deposit' | 'withdraw';
export type PaymentType = 'all' | 'bank' | 'truemoney' | 'manual';
export type AutoType = 'all' | 'auto' | 'manual';

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

