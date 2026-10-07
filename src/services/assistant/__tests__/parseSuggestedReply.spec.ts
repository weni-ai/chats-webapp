import { describe, expect, it } from 'vitest';
import {
  parseSuggestedReply,
  stripSuggestedReplyFences,
} from '../parseSuggestedReply';

const SCREENSHOT_TEXT = [
  '**Endereço da loja 1:** Loja Faria Lima, 4440 Avenida Brigadeiro Faria Lima, São Paulo, SP - 04538-132. Fonte: base de conhecimento do projeto. Não há ferramenta de transferência disponível nesta sessão. Como o atendimento já está com um representante humano, você pode assumir a conversa e responder:',
  '```suggested-reply',
  'A loja 1 fica na Avenida Brigadeiro Faria Lima, 4440, em São Paulo, SP, CEP 04538-132. Vou seguir com seu atendimento por aqui.',
  '```',
].join('\n');

describe('parseSuggestedReply', () => {
  it('extracts the reply and leading text from a suggested-reply block', () => {
    expect(parseSuggestedReply(SCREENSHOT_TEXT)).toEqual({
      leading:
        '**Endereço da loja 1:** Loja Faria Lima, 4440 Avenida Brigadeiro Faria Lima, São Paulo, SP - 04538-132. Fonte: base de conhecimento do projeto. Não há ferramenta de transferência disponível nesta sessão. Como o atendimento já está com um representante humano, você pode assumir a conversa e responder:',
      reply:
        'A loja 1 fica na Avenida Brigadeiro Faria Lima, 4440, em São Paulo, SP, CEP 04538-132. Vou seguir com seu atendimento por aqui.',
      trailing: '',
      hasBlock: true,
    });
  });

  it('extracts trailing text after the block', () => {
    const text =
      'Before the reply.\n```suggested-reply\nHello there\n```\nAfter the reply.';

    expect(parseSuggestedReply(text)).toEqual({
      leading: 'Before the reply.',
      reply: 'Hello there',
      trailing: 'After the reply.',
      hasBlock: true,
    });
  });

  it('returns the original text when there is no block', () => {
    expect(parseSuggestedReply('Just a normal reply')).toEqual({
      leading: 'Just a normal reply',
      reply: '',
      trailing: '',
      hasBlock: false,
    });
  });

  it('treats an empty block as missing', () => {
    const text = 'Intro\n```suggested-reply\n\n```';

    expect(parseSuggestedReply(text)).toEqual({
      leading: text,
      reply: '',
      trailing: '',
      hasBlock: false,
    });
  });

  it('uses only the first block when there are several', () => {
    const text = [
      'First intro',
      '```suggested-reply',
      'First reply',
      '```',
      'Middle',
      '```suggested-reply',
      'Second reply',
      '```',
    ].join('\n');

    expect(parseSuggestedReply(text)).toEqual({
      leading: 'First intro',
      reply: 'First reply',
      trailing: 'Middle\n```suggested-reply\nSecond reply\n```',
      hasBlock: true,
    });
  });

  it('parses CRLF and extra whitespace around the fence', () => {
    const text =
      'Leading line.\r\n```suggested-reply  \r\n  Copy this   \r\n  ```\r\nTrailing line.';

    expect(parseSuggestedReply(text)).toEqual({
      leading: 'Leading line.',
      reply: 'Copy this',
      trailing: 'Trailing line.',
      hasBlock: true,
    });
  });
});

describe('stripSuggestedReplyFences', () => {
  it('removes a complete suggested-reply fence from the message', () => {
    expect(stripSuggestedReplyFences(SCREENSHOT_TEXT)).toBe(
      [
        '**Endereço da loja 1:** Loja Faria Lima, 4440 Avenida Brigadeiro Faria Lima, São Paulo, SP - 04538-132. Fonte: base de conhecimento do projeto. Não há ferramenta de transferência disponível nesta sessão. Como o atendimento já está com um representante humano, você pode assumir a conversa e responder:',
        'A loja 1 fica na Avenida Brigadeiro Faria Lima, 4440, em São Paulo, SP, CEP 04538-132. Vou seguir com seu atendimento por aqui.',
      ].join('\n'),
    );
  });

  it('strips an opening fence before the closing fence arrives', () => {
    expect(
      stripSuggestedReplyFences('Intro\n```suggested-reply\nHello so far'),
    ).toBe('Intro\nHello so far');
  });

  it('hides an incomplete opening fence while it streams in', () => {
    expect(stripSuggestedReplyFences('Intro\n```sugg')).toBe('Intro');
    expect(stripSuggestedReplyFences('Intro\n```')).toBe('Intro');
    expect(stripSuggestedReplyFences('Intro\n``')).toBe('Intro');
  });

  it('leaves a closed markdown code block unchanged', () => {
    const codeBlock = 'Text\n```js\ncode\n```';

    expect(stripSuggestedReplyFences(codeBlock)).toBe(codeBlock);
  });

  it('leaves an unmatched regular code fence unchanged', () => {
    const openCodeBlock = 'Text\n```js\ncode';

    expect(stripSuggestedReplyFences(openCodeBlock)).toBe(openCodeBlock);
  });

  it('leaves messages without fences unchanged', () => {
    expect(stripSuggestedReplyFences('No fences here')).toBe('No fences here');
  });
});
