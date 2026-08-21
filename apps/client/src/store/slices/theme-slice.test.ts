import { describe, it, expect } from 'vitest';

import themeReducer, { initialStateTheme, setTheme } from './theme-slice';

describe('theme-slice', () => {
  it('возвращает начальное состояние (тёмная тема)', () => {
    expect(themeReducer(undefined, { type: '@@init' })).toEqual(initialStateTheme);
    expect(initialStateTheme.isDark).toBe(true);
  });

  it('setTheme: переключает на светлую тему', () => {
    const state = themeReducer(undefined, setTheme({ isDark: false }));
    expect(state.isDark).toBe(false);
  });

  it('setTheme: переключает на тёмную тему', () => {
    const light = themeReducer(undefined, setTheme({ isDark: false }));
    const state = themeReducer(light, setTheme({ isDark: true }));
    expect(state.isDark).toBe(true);
  });
});
