import 'dotenv/config';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchCode, getFileContent } from '../src/agent/tools.js';
import searchCodeMock from '../tests/data/search_code.js';
import getFileContentMock from '../tests/data/get_file_content.js';

vi.stubGlobal('fetch', vi.fn());

describe('tools.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchCode', () => {
    it('should return error when missing repository context', async () => {
      const result = await searchCode.invoke({ query: 'test' }, { configurable: {} });
      expect(result).toContain('Error: Missing repository context');
    });

    it('should return error when missing partial context', async () => {
      const result = await searchCode.invoke({ query: 'test' }, { configurable: { owner: 'test' } });
      expect(result).toContain('Error: Missing repository context');
    });

    it('should return no results message when search returns empty', async () => {
      fetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ token: 'mock-token' }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ items: [], total_count: 0 }) });

      const result = await searchCode.invoke(
        { query: 'test' },
        { configurable: { owner: 'test', repo: 'test', installationId: 1 } }
      );
      
      expect(result).toBe('No results found.');
    });

    it('should return formatted results', async () => {
      fetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ token: 'mock-token' }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(searchCodeMock) });

      const result = await searchCode.invoke(
        { query: 'test' },
        { configurable: { owner: 'test', repo: 'test', installationId: 1 } }
      );
      
      expect(result).toContain(`Found ${searchCodeMock.total_count} results`);
      expect(result).toContain('test.js');
    });

    it('should return error message on failure', async () => {
      fetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ token: 'mock-token' }) })
        .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ message: 'API Error' }) });

      const result = await searchCode.invoke(
        { query: 'test' },
        { configurable: { owner: 'test', repo: 'test', installationId: 1 } }
      );
      
      expect(result).toContain('Search error');
    });
  });

  describe('getFileContent', () => {
    it('should return error when missing repository context', async () => {
      const result = await getFileContent.invoke({ path: 'src/index.js' }, { configurable: {} });
      expect(result).toContain('Error: Missing repository context');
    });

    it('should return file content', async () => {
      fetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ token: 'mock-token' }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({
          path: 'src/index.js',
          content: 'console.log("hello")',
          encoding: 'utf-8',
        }) });

      const result = await getFileContent.invoke(
        { path: 'src/index.js' },
        { configurable: { owner: 'test', repo: 'test', installationId: 1 } }
      );
      
      expect(result).toBe('console.log("hello")');
    });

    it('should handle base64 encoding', async () => {
      fetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ token: 'mock-token' }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(getFileContentMock) });

      const result = await getFileContent.invoke(
        { path: 'test.js' },
        { configurable: { owner: 'test', repo: 'test', installationId: 1 } }
      );
      
      expect(result).toContain('File: test.js');
      expect(result).toContain('function test()');
    });

    it('should return error message on failure', async () => {
      fetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ token: 'mock-token' }) })
        .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ message: 'Not Found' }) });

      const result = await getFileContent.invoke(
        { path: 'nonexistent.js' },
        { configurable: { owner: 'test', repo: 'test', installationId: 1 } }
      );
      
      expect(result).toContain('Not Found');
    });
  });
});
