import { POST } from '../../app/api/users/import/route';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import * as xlsx from 'xlsx';
import * as bcrypt from 'bcryptjs';

// Use vi.hoisted to ensure these are available during mocking
const { 
  mockUserCreate, 
  mockUserFindUnique,
  mockSuperadminCreate,
  mockAmilCreate,
  mockRelawanCreate,
  mockJwtVerify, 
  mockCookiesGet,
  mockXlsxRead,
  mockSheetToJson,
  mockBcryptHash
} = vi.hoisted(() => ({
  mockUserCreate: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockSuperadminCreate: vi.fn(),
  mockAmilCreate: vi.fn(),
  mockRelawanCreate: vi.fn(),
  mockJwtVerify: vi.fn(),
  mockCookiesGet: vi.fn(),
  mockXlsxRead: vi.fn(),
  mockSheetToJson: vi.fn(),
  mockBcryptHash: vi.fn(),
}));

vi.stubGlobal('File', class MockFile {
  name: string;
  type: string;
  size: number;
  content: string[];

  constructor(content: string[], name: string, options: { type?: string } = {}) {
    this.content = content;
    this.name = name;
    this.type = options.type || '';
    this.size = content.reduce((acc, chunk) => acc + chunk.length, 0);
  }

  text() {
    return Promise.resolve(this.content.join(''));
  }

  arrayBuffer() {
    const text = this.content.join('');
    const buffer = new ArrayBuffer(text.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < text.length; i++) {
      view[i] = text.charCodeAt(i);
    }
    return Promise.resolve(buffer);
  }
});

// Also mock FormData
vi.stubGlobal('FormData', class MockFormData {
  private data = new Map<string, any>();

  append(key: string, value: any) {
    this.data.set(key, value);
  }

  set(key: string, value: any) {
    this.data.set(key, value);
  }

  get(key: string) {
    return this.data.get(key);
  }

  has(key: string) {
    return this.data.has(key);
  }
});

// Mock Prisma client
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn(() => ({
      user: {
        create: mockUserCreate,
        findUnique: mockUserFindUnique,
      },
      superadmin: {
        create: mockSuperadminCreate,
      },
      amil: {
        create: mockAmilCreate,
      },
      relawan: {
        create: mockRelawanCreate,
      },
      $disconnect: vi.fn(),
    })),
  };
});

// Mock xlsx
vi.mock('xlsx', () => {
  return {
    read: mockXlsxRead,
    utils: {
      sheet_to_json: mockSheetToJson,
    },
  };
});

// Mock bcryptjs
vi.mock('bcryptjs', () => {
  return {
    hash: mockBcryptHash,
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

describe('User Import API Endpoint', () => {
  const mockUserId = 1;
  const mockUserRecord = {
    id: 1,
    nama: 'John Doe',
    email: 'john@example.com',
    password: 'hashed_password',
    role: 'amil',
    alamat: 'Jl. Contoh No. 123',
    no_telp: '08123456789',
    created_at: new Date('2023-01-01'),
  };

  const mockExcelData = [
    {
      'Nama Pengguna': 'John Doe',
      'Email': 'john@example.com',
      'No Telp': '08123456789',
      'Alamat': 'Jl. Contoh No. 123',
      'Peran': 'amil',
    },
  ];

  const mockWorkbook = {
    SheetNames: ['Sheet1'],
    Sheets: {
      Sheet1: {},
    },
  };

  const mockFile = new File(['test'], 'test.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const mockFormData = new FormData();

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
    
    // Mock xlsx functions
    mockXlsxRead.mockReturnValue(mockWorkbook);
    mockSheetToJson.mockReturnValue(mockExcelData);
    
    // Mock bcrypt
    mockBcryptHash.mockResolvedValue('hashed_password');
    
    // Mock Prisma responses
    mockUserCreate.mockResolvedValue(mockUserRecord);
    mockUserFindUnique.mockResolvedValue(null);
    mockSuperadminCreate.mockResolvedValue({ id: 1 });
    mockAmilCreate.mockResolvedValue({ id: 1 });
    mockRelawanCreate.mockResolvedValue({ id: 1 });
    
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

    // Setup mock FormData
    mockFormData.set('file', mockFile);
  });

  describe('POST endpoint', () => {
    it('should return 401 when no token is provided', async () => {
      mockCookiesGet.mockReturnValueOnce(undefined);
      
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(401);
      expect(json.message).toContain('Akses ditolak');
    });

    it('should return 400 when no file is provided', async () => {
      const emptyFormData = new FormData();
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(emptyFormData),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.message).toContain('File tidak ditemukan');
    });

    it('should return 400 when file type is not supported', async () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const invalidFormData = new FormData();
      invalidFormData.set('file', invalidFile);
      
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(invalidFormData),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.message).toContain('Format file tidak didukung');
    });

    it('should return 400 when Excel file is corrupted', async () => {
      mockXlsxRead.mockImplementationOnce(() => {
        throw new Error('Invalid Excel file');
      });
      
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.message).toContain('File Excel rusak');
    });

    it('should return 400 when required columns are missing', async () => {
      const invalidData = [{ 'Invalid Column': 'value' }];
      mockSheetToJson.mockReturnValueOnce(invalidData);
      
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.message).toContain('Format import tidak sesuai');
    });

    it('should return 400 when file is empty', async () => {
      mockSheetToJson.mockReturnValueOnce([]);
      
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.message).toContain('File Excel kosong');
    });

    it('should handle invalid email format', async () => {
      const invalidData = [{
        ...mockExcelData[0],
        'Email': 'invalid-email',
      }];
      mockSheetToJson.mockReturnValueOnce(invalidData);
      
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.message).toBe('Import gagal total - Tidak ada data pengguna yang berhasil diimport. Periksa format dan data yang diimport.');
      expect(json.summary.failed).toBe(1);
      expect(json.errors[0]).toContain('Format email tidak valid');
    });

    it('should handle duplicate email', async () => {
      mockUserFindUnique.mockResolvedValueOnce(mockUserRecord);
      
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.message).toBe('Import gagal total - Tidak ada data pengguna yang berhasil diimport. Periksa format dan data yang diimport.');
      expect(json.summary.failed).toBe(1);
      expect(json.errors[0]).toContain('Email sudah terdaftar');
    });

    it('should handle invalid role', async () => {
      const invalidData = [{
        ...mockExcelData[0],
        'Peran': 'invalid-role',
      }];
      mockSheetToJson.mockReturnValueOnce(invalidData);
      
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.message).toBe('Import gagal total - Tidak ada data pengguna yang berhasil diimport. Periksa format dan data yang diimport.');
      expect(json.summary.failed).toBe(1);
      expect(json.errors[0]).toContain('Peran tidak valid');
    });

    it('should handle incomplete data', async () => {
      const incompleteData = [{
        'Nama Pengguna': 'John Doe',
        'Email': '',
        'No Telp': '08123456789',
        'Alamat': 'Jl. Contoh No. 123',
        'Peran': 'amil',
      }];
      mockSheetToJson.mockReturnValueOnce(incompleteData);
      
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.message).toBe('Import gagal total - Tidak ada data pengguna yang berhasil diimport. Periksa format dan data yang diimport.');
      expect(json.summary.failed).toBe(1);
      expect(json.errors[0]).toContain('Data tidak lengkap');
    });

    it('should handle database errors gracefully', async () => {
      mockUserCreate.mockRejectedValueOnce(new Error('Database error'));
      
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.message).toBe('Import gagal total - Tidak ada data pengguna yang berhasil diimport. Periksa format dan data yang diimport.');
      expect(json.summary.failed).toBe(1);
    });

    it('should handle invalid phone number format', async () => {
      const invalidData = [{
        ...mockExcelData[0],
        'No Telp': 'invalid-phone!@#',
      }];
      mockSheetToJson.mockReturnValueOnce(invalidData);
      
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.message).toBe('Import gagal total - Tidak ada data pengguna yang berhasil diimport. Periksa format dan data yang diimport.');
      expect(json.summary.failed).toBe(1);
      expect(json.errors[0]).toContain('Format nomor telepon tidak valid');
    });

    it('should limit error messages to 10 items', async () => {
      const manyErrorsData = Array.from({ length: 15 }, (_, i) => ({
        ...mockExcelData[0],
        'Email': '', // This will cause error
        'Nama Pengguna': `User ${i + 1}`,
      }));
      mockSheetToJson.mockReturnValueOnce(manyErrorsData);
      
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(json.errors.length).toBe(10);
      expect(json.summary.failed).toBe(15);
    });
  });
});