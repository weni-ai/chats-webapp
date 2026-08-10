export interface SelectOption {
  label: string;
  value: string;
}

export interface ShippingHistoryItem {
  message?: string;
  contact?: { name?: string };
  queue?: { name?: string };
  sent_by?: { name?: string };
  date: string;
  status: string;
}

export interface TableHeader {
  id: string;
  text: string;
  flex: number;
}

export interface FilterDate {
  start: string;
  end: string;
}
