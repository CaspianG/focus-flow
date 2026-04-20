export {};

declare global {
  interface Window {
    focusFlowDesktop?: {
      platform: NodeJS.Platform;
    };
  }
}
