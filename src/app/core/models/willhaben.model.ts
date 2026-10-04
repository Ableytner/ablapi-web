export interface WillhabenConfigDto {
  id: number;
  name: string;
  keyword: string;
  category: number;
  rows: number;
  price_min: number;
  price_max: number;
  filter_paylivery: boolean;
  handover_types: string[];
  allowed_states: string[];
  km_max: number;
  must_include: string[];
  must_exclude: string[];
  sort_by_distance: boolean;
  reference_lat: number;
  reference_lon: number;
  max_distance_km: number;
}

export interface CreateWillhabenConfigDto {
  name: string;
  keyword: string;
  category: number;
  rows: number;
  price_min: number;
  price_max: number;
  filter_paylivery: boolean;
  handover_types: string[];
  allowed_states: string[];
  km_max: number;
  must_include: string[];
  must_exclude: string[];
  sort_by_distance: boolean;
  reference_lat: number;
  reference_lon: number;
  max_distance_km: number;
  // Form-only fields (comma-separated string input)
  handover_types_raw?: string;
  allowed_states_raw?: string;
  must_include_raw?: string;
  must_exclude_raw?: string;
}
