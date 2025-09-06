export interface ElectronAPI {
  platform: string;
  versions: NodeJS.ProcessVersions;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    webkitAudioContext?: AudioContext;
    electron?: {
      ipcRenderer: {
        send(channel: string, ...args: unknown[]): void;
      };
    };
  }
}
