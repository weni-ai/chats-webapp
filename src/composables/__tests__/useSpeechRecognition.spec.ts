import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, ref } from 'vue';
import { mount } from '@vue/test-utils';

import {
  listSpeechRecognitionLangPacks,
  toSpeechRecognitionLang,
  useSpeechRecognition,
} from '../useSpeechRecognition';

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = '';
  processLocally = false;
  onend: ((_ev: Event) => void) | null = null;
  onerror: ((_ev: Event) => void) | null = null;
  onresult: ((_ev: Event) => void) | null = null;
  onstart: ((_ev: Event) => void) | null = null;

  start = vi.fn(() => {
    this.onstart?.(new Event('start'));
  });

  stop = vi.fn(() => {
    this.onend?.(new Event('end'));
  });

  abort = vi.fn();
}

const mountSpeechRecognition = (options = {}) => {
  let composable;

  const wrapper = mount(
    defineComponent({
      setup() {
        composable = useSpeechRecognition(options);
        return () => null;
      },
    }),
  );

  return { composable, wrapper };
};

describe('toSpeechRecognitionLang', () => {
  it.each([
    ['en', 'en-US'],
    ['en-us', 'en-US'],
    ['en_US', 'en-US'],
    ['es', 'es-ES'],
    ['pt-br', 'pt-BR'],
    ['pt_br', 'pt-BR'],
    ['ro', 'ro-RO'],
  ])('maps platform locale %s to %s', (locale, expected) => {
    expect(toSpeechRecognitionLang(locale)).toBe(expected);
  });

  it('falls back to en-US for unknown locales', () => {
    expect(toSpeechRecognitionLang('fr')).toBe('en-US');
    expect(toSpeechRecognitionLang(undefined)).toBe('en-US');
  });
});

describe('useSpeechRecognition', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('webkitSpeechRecognition', MockSpeechRecognition);
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'table').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('assigns BCP 47 lang on the recognition instance', () => {
    const instances: MockSpeechRecognition[] = [];

    class CapturingSpeechRecognition extends MockSpeechRecognition {
      constructor() {
        super();
        instances.push(this);
      }
    }

    vi.stubGlobal('webkitSpeechRecognition', CapturingSpeechRecognition);

    const { composable, wrapper } = mountSpeechRecognition({ lang: 'pt-BR' });
    composable.start();

    expect(instances[0].lang).toBe('pt-BR');
    wrapper.unmount();
  });

  it('does not set lang when the mapped language is en-US', () => {
    const instances: MockSpeechRecognition[] = [];

    class CapturingSpeechRecognition extends MockSpeechRecognition {
      constructor() {
        super();
        instances.push(this);
      }
    }

    vi.stubGlobal('webkitSpeechRecognition', CapturingSpeechRecognition);

    const { composable, wrapper } = mountSpeechRecognition();
    composable.start();

    expect(instances[0].lang).toBe('');
    wrapper.unmount();
  });

  it('does not set lang when lang is en-US', () => {
    const instances: MockSpeechRecognition[] = [];

    class CapturingSpeechRecognition extends MockSpeechRecognition {
      constructor() {
        super();
        instances.push(this);
      }
    }

    vi.stubGlobal('webkitSpeechRecognition', CapturingSpeechRecognition);

    const { composable, wrapper } = mountSpeechRecognition({ lang: 'en-US' });
    composable.start();

    expect(instances[0].lang).toBe('');
    wrapper.unmount();
  });

  it('restarts recognition when the selected locale changes', () => {
    const instances: MockSpeechRecognition[] = [];

    class CapturingSpeechRecognition extends MockSpeechRecognition {
      constructor() {
        super();
        instances.push(this);
      }
    }

    vi.stubGlobal('webkitSpeechRecognition', CapturingSpeechRecognition);

    const lang = ref('en-US');
    const { composable, wrapper } = mountSpeechRecognition({ lang });

    composable.start();
    expect(instances[0].lang).toBe('');

    lang.value = 'es-ES';
    vi.advanceTimersByTime(150);

    expect(instances[1].lang).toBe('es-ES');
    expect(composable.isListening.value).toBe(true);
    wrapper.unmount();
  });

  it('falls back to the base language when the regional tag is not supported', () => {
    const instances: MockSpeechRecognition[] = [];

    class CapturingSpeechRecognition extends MockSpeechRecognition {
      constructor() {
        super();
        instances.push(this);
      }
    }

    vi.stubGlobal('webkitSpeechRecognition', CapturingSpeechRecognition);

    const { composable, wrapper } = mountSpeechRecognition({ lang: 'es-ES' });
    composable.start();

    expect(instances[0].lang).toBe('es-ES');

    instances[0].onerror?.({
      error: 'language-not-supported',
    } as Event & { error: string });
    instances[0].onend?.(new Event('end'));
    vi.advanceTimersByTime(150);

    expect(instances[1].lang).toBe('es');
    expect(composable.isListening.value).toBe(true);
    wrapper.unmount();
  });

  it('starts cloud recognition immediately without waiting for language packs', () => {
    const instances: MockSpeechRecognition[] = [];

    class CapturingSpeechRecognition extends MockSpeechRecognition {
      static available = vi.fn().mockResolvedValue('unavailable');
      static install = vi.fn();

      constructor() {
        super();
        instances.push(this);
      }
    }

    vi.stubGlobal('webkitSpeechRecognition', CapturingSpeechRecognition);

    const { composable, wrapper } = mountSpeechRecognition({ lang: 'ro-RO' });
    composable.start();

    expect(CapturingSpeechRecognition.install).not.toHaveBeenCalled();
    expect(instances[0].lang).toBe('ro-RO');
    expect(instances[0].processLocally).toBe(false);
    wrapper.unmount();
  });
});

describe('listSpeechRecognitionLangPacks', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('logs on-device and cloud availability for platform languages', async () => {
    class PackSpeechRecognition extends MockSpeechRecognition {
      static available = vi.fn(async ({ langs }) =>
        langs[0] === 'pt-BR' ? 'available' : 'downloadable',
      );
      static install = vi.fn();
    }

    vi.stubGlobal('SpeechRecognition', PackSpeechRecognition);
    const tableSpy = vi.spyOn(console, 'table').mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const rows = await listSpeechRecognitionLangPacks();

    expect(rows).toEqual([
      { lang: 'pt-BR', onDevice: 'available', cloudOrLocal: 'available' },
      {
        lang: 'en-US',
        onDevice: 'downloadable',
        cloudOrLocal: 'downloadable',
      },
      {
        lang: 'es-ES',
        onDevice: 'downloadable',
        cloudOrLocal: 'downloadable',
      },
      {
        lang: 'ro-RO',
        onDevice: 'downloadable',
        cloudOrLocal: 'downloadable',
      },
    ]);
    expect(tableSpy).toHaveBeenCalled();

    tableSpy.mockRestore();
    infoSpy.mockRestore();
  });
});
