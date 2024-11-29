import { describe, it, expect } from 'vitest';
import { removeDuplicatedItems } from '../array';

describe('removeDuplicatedItems', () => {
  it('should remove duplicated items based on the default key (uuid)', () => {
    const array = [
      { uuid: '1', name: 'John' },
      { uuid: '2', name: 'Jane' },
      { uuid: '1', name: 'John Duplicate' },
      { uuid: '3', name: 'Bob' },
    ];

    const result = removeDuplicatedItems(array);

    expect(result).toEqual([
      { uuid: '1', name: 'John' },
      { uuid: '2', name: 'Jane' },
      { uuid: '3', name: 'Bob' },
    ]);
  });

  it('should remove duplicated items based on a custom key', () => {
    const array = [
      { id: 'a', name: 'John' },
      { id: 'b', name: 'Jane' },
      { id: 'a', name: 'John Duplicate' },
      { id: 'c', name: 'Bob' },
    ];

    const result = removeDuplicatedItems(array, 'id');

    expect(result).toEqual([
      { id: 'a', name: 'John' },
      { id: 'b', name: 'Jane' },
      { id: 'c', name: 'Bob' },
    ]);
  });

  it('should return the original array if there are no duplicates', () => {
    const array = [
      { uuid: '1', name: 'John' },
      { uuid: '2', name: 'Jane' },
      { uuid: '3', name: 'Bob' },
    ];

    const result = removeDuplicatedItems(array);

    expect(result).toEqual(array);
  });

  it('should return an empty array if input is empty', () => {
    const array = [];

    const result = removeDuplicatedItems(array);

    expect(result).toEqual([]);
  });
});
