
export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  created_at: string;
  restaurant_id: string | null;
  restaurant?: Restaurant | null;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string | null;
  email: string | null;
  phone: string | null;
}

export interface UserFormData {
  first_name: string;
  last_name: string;
  role: string;
  email?: string;
  password?: string;
  restaurant_name?: string;
  restaurant_address?: string;
  restaurant_email?: string;
  restaurant_phone?: string;
}
