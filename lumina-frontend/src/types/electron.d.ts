export interface ElectronAPI {
  platform: string;
  versions: NodeJS.ProcessVersions;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}