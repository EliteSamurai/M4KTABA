export const customAlphabet = () => () => 'test-nanoid';

export const nanoid = Object.assign(() => 'test-nanoid', {
  customAlphabet,
});

