import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

import useLocalStorage from './use-local-storage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('возвращает дефолтное значение если ключ отсутствует', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('читает существующее значение из localStorage', () => {
    localStorage.setItem('existing-key', JSON.stringify('saved-value'));
    const { result } = renderHook(() => useLocalStorage('existing-key', 'default'));
    expect(result.current[0]).toBe('saved-value');
  });

  it('сохраняет новое значение в localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('save-key', 'initial'));
    act(() => {
      result.current[1]('updated');
    });
    expect(result.current[0]).toBe('updated');
    expect(JSON.parse(localStorage.getItem('save-key')!)).toBe('updated');
  });

  it('возвращает дефолт при невалидном JSON в localStorage', () => {
    localStorage.setItem('bad-key', '{invalid json}');
    const { result } = renderHook(() => useLocalStorage('bad-key', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });
});
