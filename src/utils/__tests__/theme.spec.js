import { afterEach, describe, expect, it } from 'vitest';

import {
  applyRouteAwareTheme,
  startLightThemeEnforcement,
  stopLightThemeEnforcement,
} from '../theme';

describe('applyRouteAwareTheme', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('applies dark mode to the provided mount container', () => {
    const liveDesk = document.createElement('div');
    liveDesk.className = 'chats-webapp';
    const settings = document.createElement('div');
    settings.className = 'chats-webapp';
    document.body.append(liveDesk, settings);

    applyRouteAwareTheme('dark', '/rooms', settings);

    expect(liveDesk.classList.contains('dark')).toBe(false);
    expect(settings.classList.contains('dark')).toBe(true);
  });

  it('forces light mode on settings routes even when theme is dark', () => {
    const settings = document.createElement('div');
    settings.className = 'chats-webapp dark';
    document.body.appendChild(settings);

    applyRouteAwareTheme('dark', '/settings/chats', settings);

    expect(settings.classList.contains('dark')).toBe(false);
  });

  it('forces light mode when forceLight is set regardless of route path', () => {
    const settings = document.createElement('div');
    settings.className = 'chats-webapp dark';
    document.body.appendChild(settings);

    // Even a non-light-only path (e.g. the transient `/` before the based
    // mount navigates to `/settings`) must stay light when forceLight is true.
    applyRouteAwareTheme('dark', '/', settings, true);

    expect(settings.classList.contains('dark')).toBe(false);
  });

  it('keeps route-aware behavior when forceLight is false', () => {
    const liveDesk = document.createElement('div');
    liveDesk.className = 'chats-webapp';
    document.body.appendChild(liveDesk);

    applyRouteAwareTheme('dark', '/rooms', liveDesk, false);

    expect(liveDesk.classList.contains('dark')).toBe(true);
  });

});

describe('light theme enforcement', () => {
  afterEach(() => {
    // Guard against test leaks: drop `.dark` and force-drain the refcount.
    document.documentElement.classList.remove('dark');
    for (let i = 0; i < 8; i += 1) stopLightThemeEnforcement();
  });

  it('strips the initial `.dark` class from documentElement on start', () => {
    document.documentElement.classList.add('dark');

    startLightThemeEnforcement();

    expect(document.documentElement.classList.contains('dark')).toBe(false);

    stopLightThemeEnforcement();
  });

  it('re-strips `.dark` when something re-adds it while enforcement is active', async () => {
    startLightThemeEnforcement();

    document.documentElement.classList.add('dark');

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.documentElement.classList.contains('dark')).toBe(false);

    stopLightThemeEnforcement();
  });

  it('stops observing after stopLightThemeEnforcement', async () => {
    startLightThemeEnforcement();
    stopLightThemeEnforcement();

    document.documentElement.classList.add('dark');

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('is refcounted across multiple start/stop calls', async () => {
    startLightThemeEnforcement();
    startLightThemeEnforcement();
    stopLightThemeEnforcement();

    document.documentElement.classList.add('dark');
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Still enforced after one nested stop.
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    stopLightThemeEnforcement();

    document.documentElement.classList.add('dark');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
