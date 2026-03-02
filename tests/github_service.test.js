import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as githubService from '../src/services/github_service.js';
import getPullRequestFilesData from './data/get_pull_request_files.js';
import getFileContentData from './data/get_file_content.js';
import searchCodeData from './data/search_code.js';
import postCommentData from './data/post_comment.js';
import postReviewCommentsData from './data/post_review_comments.js';

vi.stubGlobal('fetch', vi.fn());

describe('github_service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getPullRequestFiles', () => {
        it('should return PR files data', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(getPullRequestFilesData)
            });

            const result = await githubService.getPullRequestFiles({
                token: 'fake-token',
                owner: 'fakeowner',
                repo: 'fake-repo',
                pullNumber: 1
            });

            expect(result).toEqual(getPullRequestFilesData);
            expect(fetch).toHaveBeenCalledWith(
                'https://api.github.com/repos/fakeowner/fake-repo/pulls/1/files',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer fake-token'
                    })
                })
            );
        });

        it('should throw error when API returns non-ok', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ message: 'Not Found' })
            });

            await expect(githubService.getPullRequestFiles({
                token: 'fake-token',
                owner: 'fakeowner',
                repo: 'fake-repo',
                pullNumber: 1
            })).rejects.toThrow('Failed to get PR files');
        });
    });

    describe('getFileContent', () => {
        it('should return file content data', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(getFileContentData)
            });

            const result = await githubService.getFileContent({
                token: 'fake-token',
                owner: 'fakeowner',
                repo: 'fake-repo',
                path: 'test.js'
            });

            expect(result).toEqual(getFileContentData);
        });

        it('should throw error when file not found', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ message: 'Not Found' })
            });

            await expect(githubService.getFileContent({
                token: 'fake-token',
                owner: 'fakeowner',
                repo: 'fake-repo',
                path: 'nonexistent.js'
            })).rejects.toThrow('Failed to get file');
        });
    });

    describe('searchCode', () => {
        it('should return search results', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(searchCodeData)
            });

            const result = await githubService.searchCode({
                token: 'fake-token',
                owner: 'fakeowner',
                repo: 'fake-repo',
                query: 'console.log'
            });

            expect(result).toEqual(searchCodeData);
            expect(fetch).toHaveBeenCalledWith(
                'https://api.github.com/search/code?q=console.log%20in%3Afile%20repo%3Afakeowner%2Ffake-repo',
                expect.any(Object)
            );
        });
    });

    describe('postComment', () => {
        it('should post a comment and return data', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(postCommentData)
            });

            const result = await githubService.postComment({
                token: 'fake-token',
                owner: 'fakeowner',
                repo: 'fake-repo',
                issueNumber: 1,
                body: 'Test comment'
            });

            expect(fetch).toHaveBeenCalledWith(
                'https://api.github.com/repos/fakeowner/fake-repo/issues/1/comments',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ body: 'Test comment' })
                })
            );
        });

        it('should throw error when posting comment fails', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ message: 'Unauthorized' })
            });

            await expect(githubService.postComment({
                token: 'fake-token',
                owner: 'fakeowner',
                repo: 'fake-repo',
                issueNumber: 1,
                body: 'Test comment'
            })).rejects.toThrow('Failed to post comment');
        });
    });

    describe('postReviewComments', () => {
        it('should post review comments', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(postReviewCommentsData)
            });

            const comments = [
                { path: 'test.js', line: 10, body: 'Great code!' }
            ];

            const result = await githubService.postReviewComments({
                token: 'fake-token',
                owner: 'fakeowner',
                repo: 'fake-repo',
                pullNumber: 1,
                commitId: 'fakecommit',
                comments
            });

            expect(fetch).toHaveBeenCalledWith(
                'https://api.github.com/repos/fakeowner/fake-repo/pulls/1/reviews',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        event: 'COMMENT',
                        commit_id: 'fakecommit',
                        body: '**test.js:10**\nGreat code!'
                    })
                })
            );
        });

        it('should throw error when posting review fails', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ message: 'Forbidden' })
            });

            await expect(githubService.postReviewComments({
                token: 'fake-token',
                owner: 'fakeowner',
                repo: 'fake-repo',
                pullNumber: 1,
                commitId: 'fakecommit',
                comments: [{ path: 'test.js', line: 10, body: 'Test' }]
            })).rejects.toThrow('Failed to post review');
        });
    });
});
