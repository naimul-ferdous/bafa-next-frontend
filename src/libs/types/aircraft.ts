export interface AircraftType {
  id: number;
  title: string;
  status: 'active' | 'deactive';
  created_by?: string;
  created_ip?: string;
  updated_by?: string;
  updated_ip?: string;
  created_at?: string;
  updated_at?: string;
  aircrafts?: Aircraft[];
}

export interface Aircraft {
  id: number;
  title: string;
  aircraft_type_id: number;
  tail_no: number;
  code: number;
  tarmac?: 'old' | 'new' | null;
  series?: 'solo' | 'dual' | null;
  svc?: string | null;
  us?: string | null;
  status: 'active' | 'deactive';
  created_by?: string;
  created_ip?: string;
  updated_by?: string;
  updated_ip?: string;
  created_at?: string;
  updated_at?: string;
  type?: AircraftType;
}
