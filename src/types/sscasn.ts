export interface SSCASNFormation {
  formasi_id: string;
  ins_nm: string;
  jabatan_nm: string;
  lokasi_nm: string;
  pendidikan_nm: string;
  jumlah_formasi: number;
  gaji_min: number;
  gaji_max: number;
  jumlah_ms: number; // Applicants who passed admin screening
}

export interface SSCASNResponse<T> {
  status: string;
  code: number;
  message: string;
  data: T[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    per_page?: number;
    links: {
      next_page_url: string | null;
      previous_page_url: string | null;
    };
  };
}
