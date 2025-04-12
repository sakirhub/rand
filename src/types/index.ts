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
  phone?: string;
  email?: string;
  notes?: string;
  created_at: string;
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
  reservation_no: string;
  customer_id: string;
  customer_name: string;
  type: ReservationType;
  date: string;
  price: number;
  currency: string;
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
} 