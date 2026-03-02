import 'dotenv/config';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { TOKEN_KEY, redis, addTokens, getTokenCounts, resetTokenCounts } from '../src/config/tokens.js';

describe('tokens.js', () => {
  beforeEach(async () => {
    await redis.del(TOKEN_KEY);
  });

  afterAll(async () => {
    await redis.quit();
  });

  it('should add and retrieve token counts', async () => {
    await addTokens(100, 50);
    const counts = await getTokenCounts();
    expect(counts.input).toBe(100);
    expect(counts.output).toBe(50);
    expect(counts.total).toBe(150);
  });

  it('should accumulate token counts', async () => {
    await addTokens(100, 50);
    await addTokens(50, 25);
    const counts = await getTokenCounts();
    expect(counts.input).toBe(150);
    expect(counts.output).toBe(75);
    expect(counts.total).toBe(225);
  });

  it('should reset token counts', async () => {
    await addTokens(100, 50);
    await resetTokenCounts();
    const counts = await getTokenCounts();
    expect(counts.input).toBe(0);
    expect(counts.output).toBe(0);
    expect(counts.total).toBe(0);
  });

  it('should handle empty counts', async () => {
    const counts = await getTokenCounts();
    expect(counts.input).toBe(0);
    expect(counts.output).toBe(0);
    expect(counts.total).toBe(0);
  });
});
