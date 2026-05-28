export interface Transfer {
  block_timestamp: string;
  transaction_hash: string;
  from_address: string;
  to_address: string;
  from_address_label: string | null;
  to_address_label: string | null;
  transaction_type: string;
  transfer_amount: string;
  transfer_value_usd: number;
}

export interface ChainTransfers {
  chain: string;
  label: string;
  color: string;
  shortLabel: string;
  transfers: Transfer[];
  error?: string;
  pagination?: { page: number; per_page: number; is_last_page: boolean };
}

export interface DailyVolumeRow {
  date: string;
  [chain: string]: number | string;
}
