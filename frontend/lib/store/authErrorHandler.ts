// Global auth error handler
// This can be called from API client when auth errors occur
let authErrorCallback: (() => void) | null = null;

export const setAuthErrorCallback = (callback: () => void) => {
  authErrorCallback = callback;
};

export const triggerAuthError = () => {
  if (authErrorCallback) {
    authErrorCallback();
  }
};
