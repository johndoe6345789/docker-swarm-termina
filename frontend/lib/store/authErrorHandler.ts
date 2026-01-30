// Global auth error handler
// This can be called from API client when auth errors occur
let authErrorCallback: (() => void) | null = null;
let authErrorHandled = false;

export const setAuthErrorCallback = (callback: () => void) => {
  authErrorCallback = callback;
  authErrorHandled = false;
};

export const triggerAuthError = () => {
  if (!authErrorCallback) {
    return;
  }

  if (authErrorHandled) {
    return;
  }

  authErrorHandled = true;
  authErrorCallback();
};
