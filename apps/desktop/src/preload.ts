/**
 * VANTAGE Desktop - Preload Script
 * Secure bridge between main process and renderer
 */

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// ============================================
// Expose protected methods to renderer
// ============================================
contextBridge.exposeInMainWorld('electronAPI', {
  // App Info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Window Controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // External Links
  openExternalLink: (url: string) => ipcRenderer.invoke('open-external-link', url),
  
  // File System
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  saveFile: (options: Electron.SaveDialogOptions) => ipcRenderer.invoke('save-file', options),
  
  // Update Events
  onUpdateChecking: (callback: () => void) => {
    ipcRenderer.on('update-checking', () => callback());
  },
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-available', (event, info) => callback(info));
  },
  onUpdateNotAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-not-available', (event, info) => callback(info));
  },
  onUpdateDownloadProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('update-download-progress', (event, progress) => callback(progress));
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on('update-downloaded', (event, info) => callback(info));
  },
  onUpdateError: (callback: (error: Error) => void) => {
    ipcRenderer.on('update-error', (event, error) => callback(error));
  },
  
  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

// ============================================
// TypeScript types for exposed API
// ============================================
export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  openExternalLink: (url: string) => Promise<void>;
  selectDirectory: () => Promise<string | null>;
  saveFile: (options: Electron.SaveDialogOptions) => Promise<string | null>;
  onUpdateChecking: (callback: () => void) => void;
  onUpdateAvailable: (callback: (info: any) => void) => void;
  onUpdateNotAvailable: (callback: (info: any) => void) => void;
  onUpdateDownloadProgress: (callback: (progress: any) => void) => void;
  onUpdateDownloaded: (callback: (info: any) => void) => void;
  onUpdateError: (callback: (error: Error) => void) => void;
  removeAllListeners: (channel: string) => void;
}

// Declare global type
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
