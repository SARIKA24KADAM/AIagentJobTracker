export type ApplicationStatus = 'Applied' | 'Interview' | 'Assessment' | 'Offer' | 'Rejected' | 'Withdrawn';

export interface JobApplication {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  salary_range: string;
  location: string;
  job_description: string;
  application_status: ApplicationStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}
