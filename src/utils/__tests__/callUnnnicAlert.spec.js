import { describe, it, expect, vi, beforeEach } from 'vitest';
import unnnic from '@weni/unnnic-system';
import callUnnnicAlert from '../callUnnnicAlert.js';

describe('callUnnnicAlert', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="mobile-home__main"></div>
    `;

    vi.spyOn(unnnic, 'unnnicCallAlert').mockImplementation(() => {});
  });

  it('should call unnnicCallAlert with the correct props and containerRef', () => {
    const props = { type: 'success', message: 'Alert message' };

    callUnnnicAlert(props);

    expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
      ...props,
      containerRef: document.querySelector('.mobile-home__main'),
    });
  });

  it('should handle missing .mobile-home__main gracefully', () => {
    document.querySelector('.mobile-home__main').remove();

    const props = { type: 'error', message: 'Another alert' };

    callUnnnicAlert(props);

    expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
      ...props,
      containerRef: null,
    });
  });
});
