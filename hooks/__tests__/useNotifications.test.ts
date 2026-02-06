import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '../useNotifications';

describe('useNotifications', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should initialize with empty notifications', () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.notifications).toEqual([]);
  });

  it('should add a notification', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.addNotification('success', 'Test message');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].type).toBe('success');
    expect(result.current.notifications[0].message).toBe('Test message');
  });

  it('should remove a notification after timeout', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.addNotification('success', 'Test message');
    });

    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should manually remove a notification', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.addNotification('success', 'Test message');
    });

    const notificationId = result.current.notifications[0].id;

    act(() => {
      result.current.removeNotification(notificationId);
    });

    expect(result.current.notifications).toHaveLength(0);
  });
});

