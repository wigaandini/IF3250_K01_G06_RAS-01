import { GET, POST } from '../../app/api/coa/route';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

// Use vi.hoisted to ensure these are available during mocking
const { 
  mockFindMany,
  mockCreate,
  mockJwtVerify, 
  mockCookiesGet,
} = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockCreate: vi.fn(),
  mockJwtVerify: vi.fn(),
  mockCookiesGet: vi.fn(),
}));

// Mock Prisma client
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn(() => ({
      coA: {
        findMany: mockFindMany,
        create: mockCreate,
      },
      $disconnect: vi.fn(),
    })),
  };
});

// Mock next/server with proper Response behavior
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

// Mock next/headers
vi.mock('next/headers', () => {
  return {
    cookies: vi.fn(() => ({
      get: mockCookiesGet,
    })),
  };
});

// Mock jose
vi.mock('jose', () => {
  return {
    jwtVerify: mockJwtVerify,
  };
});

describe('COA API Endpoint', () => {
  const mockUserId = 1;
  const mockCoARecord = {
    id: 1,
    kode: '100.01.001.001',
    jenis_transaksi: 'Debit',
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
  };

  const mockCoAList = [
    {
      id: 1,
      kode: '100.01.001.001',
      jenis_transaksi: 'Debit',
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01'),
    },
    {
      id: 2,
      kode: '200.01.001.001',
      jenis_transaksi: 'Kredit',
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock jwtVerify to return a valid user ID by default
    mockJwtVerify.mockResolvedValue({
      payload: { id: mockUserId }
    });
    
    // Mock cookies to return a token by default
    mockCookiesGet.mockReturnValue({
      value: 'mock-token'
    });
    
    // Mock Prisma responses
    mockFindMany.mockResolvedValue(mockCoAList);
    mockCreate.mockResolvedValue(mockCoARecord);
    
    // Mock NextResponse to return proper responses
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

  describe('GET endpoint', () => {
    it('should return list of COA ordered by kode', async () => {
      const response = await GET();
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json).toEqual(mockCoAList);
      expect(mockFindMany).toHaveBeenCalledWith({
        orderBy: { kode: "asc" },
      });
    });

    it('should handle database errors gracefully', async () => {
      mockFindMany.mockRejectedValueOnce(new Error('Database error'));
      
      const response = await GET();
      const json = await response.json();
      
      expect(response.status).toBe(500);
      expect(json.error).toBe('Failed to fetch COA');
    });
  });

  describe('POST endpoint', () => {
    it('should return 401 when no token is provided', async () => {
      mockCookiesGet.mockReturnValueOnce(undefined);
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          kode: '100.01.001.001',
          jenis_transaksi: 'Debit'
        }),
      } as any;
      
      const response = await POST(mockRequest);
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
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('should return 400 when kode is missing', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          jenis_transaksi: 'Debit'
        }),
      } as any;
      
      const response = await POST(mockRequest);
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
      
      const response = await POST(mockRequest);
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
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe('Format kode COA tidak valid. Gunakan format NNN.NN.NNN.NNN');
    });

    it('should return 400 when kode format has invalid characters', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          kode: 'ABC.01.001.001',
          jenis_transaksi: 'Debit'
        }),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe('Format kode COA tidak valid. Gunakan format NNN.NN.NNN.NNN');
    });

    it('should successfully create COA with valid data', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          kode: '100.01.001.001',
          jenis_transaksi: 'Debit'
        }),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toEqual(mockCoARecord);
    });

    it('should create COA record with correct data', async () => {
      const testData = {
        kode: '100.01.001.001',
        jenis_transaksi: 'Debit'
      };
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue(testData),
      } as any;
      
      await POST(mockRequest);
      
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          kode: testData.kode,
          jenis_transaksi: testData.jenis_transaksi,
          created_at: expect.any(Date),
          updated_at: expect.any(Date),
        },
      });
    });

    it('should return 409 when kode already exists', async () => {
      const duplicateError = new Error('Unique constraint violation');
      duplicateError.code = 'P2002';
      mockCreate.mockRejectedValueOnce(duplicateError);
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          kode: '100.01.001.001',
          jenis_transaksi: 'Debit'
        }),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(409);
      expect(json.error).toBe('Kode COA sudah digunakan.');
    });

    it('should handle database errors gracefully', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Database error'));
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          kode: '100.01.001.001',
          jenis_transaksi: 'Debit'
        }),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(500);
      expect(json.error).toBe('Gagal menambahkan COA');
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
        
        const response = await POST(mockRequest);
        const json = await response.json();
        
        expect(response.status).toBe(200);
        expect(json.success).toBe(true);
      }
    });

    it('should handle different jenis_transaksi values', async () => {
      const jenisTransaksiValues = ['Debit', 'Kredit', 'Both'];

      for (const jenis_transaksi of jenisTransaksiValues) {
        const mockRequest = {
          json: vi.fn().mockResolvedValue({
            kode: '100.01.001.001',
            jenis_transaksi
          }),
        } as any;
        
        const response = await POST(mockRequest);
        const json = await response.json();
        
        expect(response.status).toBe(200);
        expect(json.success).toBe(true);
      }
    });

    it('should handle malformed JSON gracefully', async () => {
      const mockRequest = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(500);
      expect(json.error).toBe('Gagal menambahkan COA');
    });
  });
});