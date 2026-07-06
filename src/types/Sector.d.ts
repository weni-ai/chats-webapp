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
  inactivity_timeout: {
    is_message_timeout_enabled: boolean;
    message_timeout_text: string;
    message_timeout_time: number | null;
    is_close_room_enabled: boolean;
    close_room_message_text: string;
    close_room_time: number | null;
  };
  automatic_message: {
    is_active: boolean;
    text: string;
  };
  automatic_message_queue: {
    is_active: boolean;
    text: string;
  };
  managers?: SectorManager[];
  sign_messages: boolean;
  rooms_limit: number;
  required_tags: boolean;
  is_csat_enabled: boolean;
  custom_csat_flow_uuid: string | null;
}
