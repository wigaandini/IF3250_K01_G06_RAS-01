import { PUT, DELETE } from '../../app/api/coa/[id]/route';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

const { 
  mockUpdate,
  mockDelete,
  mockJwtVerify, 
  mockCookiesGet,
} = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockJwtVerify: vi.fn(),
  mockCookiesGet: vi.fn(),
}));

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn(() => ({
      coA: {
        update: mockUpdate,
        delete: mockDelete,
      },
      $disconnect: vi.fn(),
    })),
  };
});

vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: vi.fn((body, options = {}) => {
        const response = {
          status: options.status || 200,
          headers: new Map(),
          json: async () => body,
        };
        response.headers.set = vi.fn();
        response.headers.get = vi.fn();
        return response;
      }),
    },
    NextRequest: vi.fn(),
  };
});

vi.mock('next/headers', () => {
  return {
    cookies: vi.fn(() => ({
      get: mockCookiesGet,
    })),
  };
});

vi.mock('jose', () => {
  return {
    jwtVerify: mockJwtVerify,
  };
});

describe('COA [ID] API Endpoint', () => {
  const mockUserId = 1;
  const mockCoARecord = {
    id: 1,
    kode: '100.01.001.001',
    jenis_transaksi: 'Debit',
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-02'),
  };

  const mockParams = { params: { id: '1' } };
  const mockInvalidParams = { params: { id: 'invalid' } };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockJwtVerify.mockResolvedValue({
      payload: { id: mockUserId }
    });
    
    mockCookiesGet.mockReturnValue({
      value: 'mock-token'
    });
    
    mockUpdate.mockResolvedValue(mockCoARecord);
    mockDelete.mockResolvedValue(mockCoARecord);
    
    vi.mocked(NextResponse.json).mockImplementation((body, options = {}) => {
      const response = {
        status: options.status || 200,
        headers: new Map(),
        json: async () => body,
      };
      response.headers.set = vi.fn();
      response.headers.get = vi.fn();
      return response as any;
    });
  });

  describe('PUT endpoint', () => {
    it('should return 401 when no token is provided', async () => {
      mockCookiesGet.mockReturnValueOnce(undefined);
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          kode: '100.01.001.001',
          jenis_transaksi: 'Debit'
        }),
      } as any;
      
      const response = await PUT(mockRequest, mockParams);
      const json = await response.json();
      
      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('should return 401 when token is invalid', async () => {
      mockJwtVerify.mockRejectedValueOnce(new Error('Invalid token'));
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          kode: '100.01.001.001',
          jenis_transaksi: 'Debit'
        }),
      } as any;
      
      const response = await PUT(mockRequest, mockParams);
      const json = await response.json();
      
      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('should return 400 when ID is invalid', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          kode: '100.01.001.001',
          jenis_transaksi: 'Debit'
        }),
      } as any;
      
      const response = await PUT(mockRequest, mockInvalidParams);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe('ID tidak valid');
    });

    it('should return 400 when kode is missing', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          jenis_transaksi: 'Debit'
        }),
      } as any;
      
      const response = await PUT(mockRequest, mockParams);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe('Kode dan jenis_transaksi wajib diisi.');
    });

    it('should return 400 when jenis_transaksi is missing', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          kode: '100.01.001.001'
        }),
      } as any;
      
      const response = await PUT(mockRequest, mockParams);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe('Kode dan jenis_transaksi wajib diisi.');
    });

    it('should return 400 when kode format is invalid', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          kode: '100.01.001',
          jenis_transaksi: 'Debit'
        }),
      } as any;
      
      const response = await PUT(mockRequest, mockParams);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe('Format kode COA tidak valid. Gunakan format NNN.NN.NNN.NNN');
    });

    it('should successfully update COA with valid data', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          kode: '100.01.001.001',
          jenis_transaksi: 'Debit'
        }),
      } as any;
      
      const response = await PUT(mockRequest, mockParams);
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toEqual(mockCoARecord);
    });

    it('should update COA record with correct data', async () => {
      const testData = {
        kode: '100.01.001.001',
        jenis_transaksi: 'Debit'
      };
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue(testData),
      } as any;
      
      await PUT(mockRequest, mockParams);
      
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          kode: testData.kode,
          jenis_transaksi: testData.jenis_transaksi,
          updated_at: expect.any(Date),
        },
      });
    });

    it('should return 409 when kode already exists', async () => {
      const duplicateError = new Error('Unique constraint violation');
      (duplicateError as any).code = 'P2002';
      mockUpdate.mockRejectedValueOnce(duplicateError);
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          kode: '100.01.001.001',
          jenis_transaksi: 'Debit'
        }),
      } as any;
      
      const response = await PUT(mockRequest, mockParams);
      const json = await response.json();
      
      expect(response.status).toBe(409);
      expect(json.error).toBe('Kode COA sudah digunakan.');
    });

    it('should handle database errors gracefully', async () => {
      mockUpdate.mockRejectedValueOnce(new Error('Database error'));
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          kode: '100.01.001.001',
          jenis_transaksi: 'Debit'
        }),
      } as any;
      
      const response = await PUT(mockRequest, mockParams);
      const json = await response.json();
      
      expect(response.status).toBe(500);
      expect(json.error).toBe('Gagal mengupdate COA');
    });

    it('should handle non-Error exceptions', async () => {
      mockUpdate.mockRejectedValueOnce('String error');
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          kode: '100.01.001.001',
          jenis_transaksi: 'Debit'
        }),
      } as any;
      
      const response = await PUT(mockRequest, mockParams);
      const json = await response.json();
      
      expect(response.status).toBe(500);
      expect(json.error).toBe('Gagal mengupdate COA');
    });

    it('should accept valid kode formats', async () => {
      const validCodes = [
        '100.01.001.001',
        '999.99.999.999',
        '000.00.000.000',
      ];

      for (const kode of validCodes) {
        const mockRequest = {
          json: vi.fn().mockResolvedValue({
            kode,
            jenis_transaksi: 'Debit'
          }),
        } as any;
        
        const response = await PUT(mockRequest, mockParams);
        const json = await response.json();
        
        expect(response.status).toBe(200);
        expect(json.success).toBe(true);
      }
    });

    it('should handle different valid ID formats', async () => {
      const validIds = ['1', '999', '123456'];
      
      for (const id of validIds) {
        const testParams = { params: { id } };
        const mockRequest = {
          json: vi.fn().mockResolvedValue({
            kode: '100.01.001.001',
            jenis_transaksi: 'Debit'
          }),
        } as any;
        
        const response = await PUT(mockRequest, testParams);
        const json = await response.json();
        
        expect(response.status).toBe(200);
        expect(json.success).toBe(true);
        expect(mockUpdate).toHaveBeenCalledWith({
          where: { id: parseInt(id) },
          data: {
            kode: '100.01.001.001',
            jenis_transaksi: 'Debit',
            updated_at: expect.any(Date),
          },
        });
      }
    });

    it('should handle malformed JSON gracefully', async () => {
      const mockRequest = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as any;
      
      const response = await PUT(mockRequest, mockParams);
      const json = await response.json();
      
      expect(response.status).toBe(500);
      expect(json.error).toBe('Gagal mengupdate COA');
    });
  });

  describe('DELETE endpoint', () => {
    it('should return 401 when no token is provided', async () => {
      mockCookiesGet.mockReturnValueOnce(undefined);
      
      const mockRequest = {} as any;
      
      const response = await DELETE(mockRequest, mockParams);
      const json = await response.json();
      
      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('should return 401 when token is invalid', async () => {
      mockJwtVerify.mockRejectedValueOnce(new Error('Invalid token'));
      
      const mockRequest = {} as any;
      
      const response = await DELETE(mockRequest, mockParams);
      const json = await response.json();
      
      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('should return 400 when ID is invalid', async () => {
      const mockRequest = {} as any;
      
      const response = await DELETE(mockRequest, mockInvalidParams);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe('ID tidak valid');
    });

    it('should successfully delete COA with valid ID', async () => {
      const mockRequest = {} as any;
      
      const response = await DELETE(mockRequest, mockParams);
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(mockDelete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should handle different valid ID formats', async () => {
      const validIds = ['1', '999', '123456'];
      
      for (const id of validIds) {
        const testParams = { params: { id } };
        const mockRequest = {} as any;
        
        const response = await DELETE(mockRequest, testParams);
        const json = await response.json();
        
        expect(response.status).toBe(200);
        expect(json.success).toBe(true);
        expect(mockDelete).toHaveBeenCalledWith({
          where: { id: parseInt(id) }
        });
      }
    });

    it('should handle database errors gracefully', async () => {
      mockDelete.mockRejectedValueOnce(new Error('Database error'));
      
      const mockRequest = {} as any;
      
      const response = await DELETE(mockRequest, mockParams);
      const json = await response.json();
      
      expect(response.status).toBe(500);
      expect(json.error).toBe('Gagal menghapus COA');
    });

    it('should handle record not found error', async () => {
      const notFoundError = new Error('Record not found');
      (notFoundError as any).code = 'P2025';
      mockDelete.mockRejectedValueOnce(notFoundError);
      
      const mockRequest = {} as any;
      
      const response = await DELETE(mockRequest, mockParams);
      const json = await response.json();
      
      expect(response.status).toBe(500);
      expect(json.error).toBe('Gagal menghapus COA');
    });

    it('should handle non-Error exceptions', async () => {
      mockDelete.mockRejectedValueOnce('String error');
      
      const mockRequest = {} as any;
      
      const response = await DELETE(mockRequest, mockParams);
      const json = await response.json();
      
      expect(response.status).toBe(500);
      expect(json.error).toBe('Gagal menghapus COA');
    });

    it('should not require request body for DELETE', async () => {
      const mockRequest = {} as any;
      
      const response = await DELETE(mockRequest, mockParams);
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(mockRequest.json).toBeUndefined();
    });
  });
});