import { POST } from '../../app/api/penyaluran/import/route';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import * as xlsx from 'xlsx';

// Mock File constructor for Node.js environment
global.File = class File {
  constructor(bits, filename, options = {}) {
    this.bits = bits;
    this.name = filename;
    this.type = options.type || '';
    this.lastModified = Date.now();
    this.size = bits[0]?.length || 0;
  }
  
  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(0));
  }
  
  stream() {
    return new ReadableStream();
  }
  
  text() {
    return Promise.resolve(this.bits[0] || '');
  }
};

// Use vi.hoisted to ensure these are available during mocking
const { mockFindUnique, mockCreate, mockJwtVerify, mockCookiesGet } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
  mockJwtVerify: vi.fn(),
  mockCookiesGet: vi.fn(),
}));

// Mock Prisma client
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn(() => ({
      mustahiq: {
        findUnique: mockFindUnique,
      },
      program_Bantuan: {
        findUnique: mockFindUnique,
      },
      coA: {
        findUnique: mockFindUnique,
      },
      penyaluran: {
        create: mockCreate,
      },
      $disconnect: vi.fn(),
    })),
  };
});

// Mock xlsx
vi.mock('xlsx', () => {
  return {
    read: vi.fn(),
    utils: {
      sheet_to_json: vi.fn(),
    },
  };
});

// Mock next/server
vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: vi.fn((body, options = {}) => ({
        status: options.status || 200,
        json: async () => body,
      })),
    },
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

describe('Penyaluran Import API Endpoint', () => {
  const mockUserId = 1;
  const mockExcelData = [
    {
      'ID PM': '1',
      'ID Program': '1',
      'COA Debet': 'DEB123',
      'COA Kredit': 'CRED456',
      'Nominal': '1000000',
      'Tgl Salur': '2023-01-01',
      'Keterangan': 'Test import'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset all mocks to default implementations
    vi.mocked(xlsx.read).mockReturnValue({ SheetNames: ['Sheet1'], Sheets: {} });
    vi.mocked(xlsx.utils.sheet_to_json).mockReturnValue(mockExcelData);
    
    // Mock jwtVerify to return a valid user ID by default
    mockJwtVerify.mockResolvedValue({
      payload: { id: mockUserId }
    });
    
    // Mock cookies to return a token by default
    mockCookiesGet.mockReturnValue({
      value: 'mock-token'
    });
  });

  describe('POST endpoint', () => {
    it('should return 401 when no token is provided', async () => {
      mockCookiesGet.mockReturnValueOnce(undefined);
      
      const req = new Request('http://localhost/api/penyaluran/import', {
        method: 'POST',
      });
      
      const response = await POST(req);
      const json = await response.json();
      
      expect(response.status).toBe(401);
      expect(json.message).toBe('Unauthorized - Token tidak valid');
    });

    it('should return 400 when no file is uploaded', async () => {
      const formData = new FormData();
      
      const req = new Request('http://localhost/api/penyaluran/import', {
        method: 'POST',
        body: formData,
      });
      
      const response = await POST(req);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.message).toBe('File tidak ditemukan - Silakan upload file Excel');
    });
  });
});