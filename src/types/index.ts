export type UserRole = "admin" | "designer" | "tattoo_artist" | "info";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export type ReservationStatus = "pending" | "approved" | "completed";
export type ReservationType = "tattoo" | "piercing";

export interface ReservationImage {
  id: string;
  reservation_id: string;
  image_url: string;
  is_before: boolean;
  created_at: string;
  description?: string;
  approved?: boolean;
  approved_by?: string;
}

export interface Reservation {
  id: string;
  reference_no?: string;
  customer_id: string;
  customers?: Customer;
  type: ReservationType;
  service_type: string;
  date: string;
  duration: number;
  price: number;
  currency: string;
  deposit_amount?: number;
  deposit_received?: boolean;
  status: ReservationStatus;
  transfer: boolean;
  sales_source?: string;
  notes?: string;
  tattoo_artist?: string;
  image_before?: string;
  image_after?: string;
  design_image?: string;
  reservation_images?: ReservationImage[];
  created_at: string;
  updated_at?: string;
}

export interface Staff {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position: "admin" | "designer" | "tattoo_artist" | "piercing_artist" | "info";
  is_active: boolean;
  created_at: string;
  updated_at: string;
} 