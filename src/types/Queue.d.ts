export interface Queue {
  uuid?: string;
  name: string;
  default_message: string;
  queue_limit: {
    is_active: boolean;
    limit: number;
  };
}
