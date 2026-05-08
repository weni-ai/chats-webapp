export interface SectorManager {
  uuid?: string;
  removed?: boolean;
  user: {
    email: string;
    first_name: string;
    last_name: string;
  };
  role: number;
  sector: string;
}
export interface Sector {
  uuid?: string;
  name: string;
  config: Record<string, any>;
  can_trigger_flows: boolean;
  can_edit_custom_fields: boolean;
  automatic_message: {
    is_active: boolean;
    text: string;
  };
  managers?: SectorManager[];
  sign_messages: boolean;
  rooms_limit: number;
  required_tags: boolean;
  is_csat_enabled: boolean;
}
