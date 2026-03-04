export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  permissions: Record<string, boolean>;
  department?: string;
  location?: string;
}

export interface DashboardStats {
  totalAssets: number;
  activeSnmpDevices: number;
  downDevices: number;
  monthlyRecurringCost: number;
  yearlyRecurringCost: number;
  expiringIn30Days: number;
  expiringIn7Days: number;
  overduePayments: number;
  openTickets: number;
  totalSoftware: number;
  totalLicenses: number;
  totalRequests: number;
}

export interface Expense {
  id: string;
  expense_name: string;
  expense_type: string;
  vendor_id?: string;
  vendor_name?: string;
  asset_id?: string;
  asset_name?: string;
  category?: string;
  amount: number;
  billing_type: string;
  start_date?: string;
  expiry_date?: string;
  auto_renew: boolean;
  renewal_reminder_days: number;
  payment_due_date?: string;
  payment_status: string;
  invoice_path?: string;
  notes?: string;
  license_type?: string;
  total_licenses?: number;
  licenses_assigned?: number;
  available_licenses?: number;
  license_key?: string;
  location_allocation?: string;
  department_allocation?: string;
  renewal_status?: string;
  renewal_history?: RenewalHistory[];
  created_at: string;
}

export interface RenewalHistory {
  id: string;
  previous_expiry_date: string;
  new_expiry_date: string;
  previous_amount: number;
  new_amount: number;
  renewed_by_name: string;
  notes?: string;
  created_at: string;
}

export interface Asset {
  id: string;
  asset_tag: string;
  name: string;
  type: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  ip_address?: string;
  mac_address?: string;
  location?: string;
  department?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  status: string;
  purchase_date?: string;
  warranty_expiry?: string;
  vendor_id?: string;
  vendor_name?: string;
  notes?: string;
  created_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  gst_number?: string;
  pan_number?: string;
  notes?: string;
  monthly_cost?: number;
  yearly_cost?: number;
  upcoming_renewals?: number;
  expenses?: Expense[];
  cost_summary?: { monthly_total: number; yearly_total: number; quarterly_total: number };
}

export interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  category?: string;
  asset_id?: string;
  asset_name?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  created_by_name?: string;
  created_at: string;
}

export interface SnmpDevice {
  id: string;
  asset_id?: string;
  asset_name?: string;
  ip_address: string;
  hostname?: string;
  status: string;
  last_polled?: string;
  uptime?: string;
  sys_name?: string;
  sys_location?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Master {
  id: string;
  type: string;
  name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
}
