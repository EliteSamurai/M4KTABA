describe('vitals client', () => {
  it('exists and can be imported without side-effects in test env', async () => {
    const mod = await import('@/app/vitals-client');
    expect(typeof mod.default).toBe('function');
  });
});
