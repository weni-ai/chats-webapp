export interface RepresentativeSector {
  name: string;
  queues: string[];
}
export interface Representative {
  name: string;
  email: string;
  status: string;
  chats_limit: {
    active: boolean;
    total: number | null;
  };
  sector: RepresentativeSector[];
  sector_chats_total_limit: number;
}

export interface RepresentativeQueuePermission {
  name: string;
  queues: {
    uuid: string;
    name: string;
    agent_in_queue: boolean;
  }[];
}
