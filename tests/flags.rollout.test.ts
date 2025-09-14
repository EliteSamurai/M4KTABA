import { bucketUserToVariant } from '@/lib/flags';

describe('rollout bucketing', () => {
  it('is deterministic for same uid', () => {
    const a = bucketUserToVariant('user-123', 50);
    const b = bucketUserToVariant('user-123', 50);
    expect(a).toBe(b);
  });

  it('kill switch percent 0 -> v1', () => {
    const v = bucketUserToVariant('any', 0);
    expect(v).toBe('v1');
  });

  it('percent 100 -> v2', () => {
    const v = bucketUserToVariant('any', 100);
    expect(v).toBe('v2');
  });
});
