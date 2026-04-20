import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('focusFlowDesktop', {
  platform: process.platform,
});
