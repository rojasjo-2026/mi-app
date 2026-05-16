export type InstallationFollowUp = {
  follow_up_id: string;
  target_date?: string | null;
  due_date?: string | null;
  reason?: string | null;
  priority?: number | null;
  notes?: string | null;
  created_from?: string | null;
  follow_up_status_id?: number | null;
  follow_up_status?: {
    follow_up_status_id?: number | null;
    code?: string | null;
    name?: string | null;
  } | null;
};

export type InstallationTechnician = {
  user_id: string;
  first_name: string;
  last_name_1: string;
  last_name_2?: string | null;
  role?: "TECHNICIAN" | "SUPERVISOR" | "ADMINISTRATION" | "ADMIN" | string;
  is_active?: boolean | null;
} | null;

export type InstallationChangeLogItem = {
  change_log_id: string;
  field_name?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  changed_by?: string | null;
  changed_at?: string | null;
};

export type InstallationDetail = {
  installation_id: string;
  installation_date: string;
  description?: string | null;
  technical_observations?: string | null;
  estimated_amount?: number | string | null;
  warranty_months?: number | null;
  warranty_end_date?: string | null;
  technician_name?: string | null;
  technician?: InstallationTechnician;
  installation_status?: string | null;
  is_active?: boolean | null;
  address_line?: string | null;
  zone?: string | null;
  city?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  location_notes?: string | null;
  reference_point?: string | null;
  follow_ups?: InstallationFollowUp[];
  change_logs?: InstallationChangeLogItem[];
  client?: {
    client_id: string;
    first_name: string;
    last_name_1: string;
    last_name_2?: string | null;
    phone_primary?: string | null;
    email?: string | null;
  } | null;
  service_type?: {
    service_type_id: number;
    code?: string | null;
    name?: string | null;
  } | null;
};
