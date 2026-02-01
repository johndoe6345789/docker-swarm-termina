import { store, RootState, AppDispatch } from '../store';

describe('Store', () => {
  it('should create store with auth reducer', () => {
    expect(store).toBeDefined();
    expect(store.getState()).toHaveProperty('auth');
  });

  it('should have correct state shape', () => {
    const state = store.getState();
    expect(state.auth).toHaveProperty('isAuthenticated');
    expect(state.auth).toHaveProperty('loading');
    expect(state.auth).toHaveProperty('username');
    expect(state.auth).toHaveProperty('error');
  });

  it('should export RootState type', () => {
    const state: RootState = store.getState();
    expect(state).toBeDefined();
  });

  it('should export AppDispatch type', () => {
    const dispatch: AppDispatch = store.dispatch;
    expect(dispatch).toBeDefined();
  });
});
