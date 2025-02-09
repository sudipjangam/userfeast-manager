
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
  created_at: string;
  subscription?: RestaurantSubscription;
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

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  features: string[];
  is_active: boolean;
}

export interface RestaurantSubscription {
  id: string;
  restaurant_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  plan?: SubscriptionPlan;
}
