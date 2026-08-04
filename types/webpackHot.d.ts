interface ImportMeta {
  webpackHot?: {
    data?: Record<string, unknown>;
    accept: (
      dependencies?: string | string[] | ((err?: Error) => void),
      callback?: (...args: any[]) => void,
    ) => void;
    dispose: (callback: (data: Record<string, unknown>) => void) => void;
    decline: (dependencies?: string | string[]) => void;
    invalidate: () => void;
  };
}
