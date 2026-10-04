export interface Downloads {
  client: string;
  client_java8: string;
  server: string;
  server_java8: string;
}

export interface DailyVersionDto {
  version: string;
  run_number: number;
  success: boolean;
  created_at: string;
  updated_at: string;
  run_url: string;
  run_url_html: string;
  downloads: Downloads;
}

export interface StableVersionDto {
  version: string;
  created_at: string;
  downloads: Downloads;
}
