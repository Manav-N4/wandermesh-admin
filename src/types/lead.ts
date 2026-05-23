export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Booked' | 'Approved';

export interface Lead {
  id: string; // Internal UUID
  name: string;
  gender: string;
  age?: number | string;
  phone: string;
  insta_id: string;
  occupation: string;
  trip: string;
  why_join: string;
  created_at: string;
  status: LeadStatus; // Frontend only state initially
}

