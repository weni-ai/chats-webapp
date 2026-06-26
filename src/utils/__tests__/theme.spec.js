import { afterEach, describe, expect, it } from 'vitest';

import { applyRouteAwareTheme } from '../theme';

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
});
