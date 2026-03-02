import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

const secret = 'test-secret';
process.env.GITHUB_WEBHOOK_SECRET = secret;

const { webhookMiddleware } = await import('../src/middleware/webhook_middleware.js');

describe('webhookMiddleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockReq = {
            headers: {},
            rawBody: ''
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn()
        };
        mockNext = vi.fn();
    });

    it('should return 401 if no signature provided', () => {
        webhookMiddleware(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.send).toHaveBeenCalledWith('Unauthorized');
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if no rawBody provided', () => {
        mockReq.headers['x-hub-signature-256'] = 'sha256=test';
        webhookMiddleware(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.send).toHaveBeenCalledWith('Unauthorized');
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() with valid signature', () => {
        const body = '{"test":"data"}';
        
        const hmac = crypto.createHmac('sha256', secret);
        const digest = 'sha256=' + hmac.update(body).digest('hex');
        
        mockReq.headers['x-hub-signature-256'] = digest;
        mockReq.rawBody = body;
        
        webhookMiddleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 with invalid signature', () => {
        mockReq.headers['x-hub-signature-256'] = 'sha256=invalidsignature';
        mockReq.rawBody = '{"test":"data"}';
        
        webhookMiddleware(mockReq, mockRes, mockNext);
        
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.send).toHaveBeenCalledWith('Unauthorized');
        expect(mockNext).not.toHaveBeenCalled();
    });
});
