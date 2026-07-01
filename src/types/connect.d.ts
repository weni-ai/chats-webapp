/**
 * Type contract for the federated `connect/sharedStore` module exposed by the
 * weni-webapp host. Keep this in sync with `weni-webapp/src/store/Shared.js`.
 */
declare module 'connect/sharedStore' {
  export interface SharedStoreUser {
    firstName: string;
    lastName: string;
    email: string;
    language: string;
  }

  export interface SharedStoreAuth {
    token: string;
  }

  export interface SharedStoreProject {
    uuid: string;
    type?: number;
  }

  export interface SharedStore {
    user: SharedStoreUser;
    auth: SharedStoreAuth;
    current: {
      project: SharedStoreProject;
    };
    isActiveFederatedModules: Record<string, boolean>;
    setUser?: (_user: Partial<SharedStoreUser>) => void;
    setLanguage?: (_language: string) => void;
    setAuthToken?: (_token: string) => void;
    setIsActiveFederatedModule?: (_module: string, _value: boolean) => void;
    setChatsTheme?: (_theme: string) => void;
    setChatsUnreadMessages?: (_count: number) => void;
  }

  export function useSharedStore(): SharedStore | null;
}
