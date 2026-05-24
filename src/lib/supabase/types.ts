// Minimal hand-typed shape for the rows we actually read in the UI.
// (For a real production app, generate types with `supabase gen types`.)

export type AssetStatus =
  | "available"
  | "assigned"
  | "borrowed"
  | "in_repair"
  | "lost"
  | "damaged"
  | "disposed";

export interface AssetRow {
  id: string;
  asset_id: string;
  qr_code: string | null;
  name: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  specification: string | null;
  photo_url: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  book_value: number | null;
  warranty_start: string | null;
  warranty_end: string | null;
  status: AssetStatus;
  condition: string | null;
  notes: string | null;
  category_id: string | null;
  location_id: string | null;
  department_id: string | null;
  project_id: string | null;
  assigned_to: string | null;
  supplier_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetListRow extends AssetRow {
  category_name: string | null;
  category_code: string | null;
  location_name: string | null;
  department_name: string | null;
  project_name: string | null;
  assigned_to_name: string | null;
  supplier_name: string | null;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role_id: string | null;
  department_id: string | null;
  position: string | null;
  status: string;
  role?: { code: string; name: string } | null;
  department?: { code: string; name: string } | null;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  prefix: string;
  useful_life_years: number;
}

export interface Location {
  id: string;
  code: string;
  name: string;
  type: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  status: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
}
