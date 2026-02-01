import { setAuthErrorCallback, triggerAuthError } from '../authErrorHandler';

describe('authErrorHandler', () => {
  it('should call callback when triggered', () => {
    const callback = jest.fn();
    setAuthErrorCallback(callback);
    triggerAuthError();
    expect(callback).toHaveBeenCalled();
  });

  it('should not call callback twice', () => {
    const callback = jest.fn();
    setAuthErrorCallback(callback);
    triggerAuthError();
    triggerAuthError();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle no callback set', () => {
    setAuthErrorCallback(null as any);
    expect(() => triggerAuthError()).not.toThrow();
  });

  it('should reset on new callback', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    setAuthErrorCallback(callback1);
    triggerAuthError();

    setAuthErrorCallback(callback2);
    triggerAuthError();

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });
});
