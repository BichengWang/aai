export interface SessionCheckData {
  implemented: boolean;
  stateFileExists: boolean;
  status: 'missing_state' | 'ready_for_browser_check';
  storageStatePath: string;
}

export interface SessionBootstrapData {
  implemented: boolean;
  prepared: boolean;
  storageStatePath: string;
  artifactsDir: string;
  next: string[];
}
