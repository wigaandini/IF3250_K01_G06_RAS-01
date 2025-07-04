import { POST } from '../../app/api/mustahiq/import/route';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import * as xlsx from 'xlsx';

// Use vi.hoisted to ensure these are available during mocking
const { 
  mockCreate, 
  mockFindFirst,
  mockCreateMustahiqAsnaf,
  mockJwtVerify, 
  mockCookiesGet,
  mockXlsxRead,
  mockSheetToJson,
  mockParseDate
} = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindFirst: vi.fn(),
  mockCreateMustahiqAsnaf: vi.fn(),
  mockJwtVerify: vi.fn(),
  mockCookiesGet: vi.fn(),
  mockXlsxRead: vi.fn(),
  mockSheetToJson: vi.fn(),
  mockParseDate: vi.fn(),
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
      mustahiq: {
        create: mockCreate,
      },
      asnaf: {
        findFirst: mockFindFirst,
      },
      mustahiqAsnaf: {
        create: mockCreateMustahiqAsnaf,
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
    SSF: {
      parse_date_code: mockParseDate,
    },
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

describe('Mustahiq Import API Endpoint', () => {
  const mockUserId = 1;
  const mockMustahiqRecord = {
    id: 1,
    nama: 'John Doe',
    jenis_kelamin: 'Laki-laki',
    tanggal_lahir: new Date('1990-01-01'),
    no_telepon: '08123456789',
    email: 'john@example.com',
    alamat: 'Jl. Contoh No. 123',
    status: 'active',
    created_by: 1,
    created_at: new Date('2023-01-01'),
  };

  const mockExcelData = [
    {
      'ID PM': 1,
      'Nama PM': 'John Doe',
      'Jenis Kelamin': 'Laki-laki',
      'Tgl Lahir': '1990-01-01',
      'HP': '08123456789',
      'Email': 'john@example.com',
      'Alamat': 'Jl. Contoh No. 123',
      'Asnaf': 'Fakir, Miskin',
      'Tgl Reg': '2023-01-01',
      'ID PJ': 1,
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
    mockParseDate.mockReturnValue({ y: 1990, m: 1, d: 1 });
    
    // Mock Prisma responses
    mockCreate.mockResolvedValue(mockMustahiqRecord);
    mockFindFirst.mockResolvedValue({ id: 1, type: 'Fakir' });
    mockCreateMustahiqAsnaf.mockResolvedValue({ id: 1 });
    
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
      expect(json.error).toBe('UNAUTHORIZED');
      expect(json.message).toBe('Unauthorized - Token tidak valid');
    });

    it('should return 400 when no file is provided', async () => {
      const emptyFormData = new FormData();
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(emptyFormData),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe('NO_FILE');
      expect(json.message).toBe('File tidak ditemukan');
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
      expect(json.error).toBe('INVALID_FILE_TYPE');
      expect(json.message).toBe('Format file tidak didukung. Gunakan file Excel (.xlsx atau .xls)');
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
      expect(json.error).toBe('CORRUPTED_FILE');
      expect(json.message).toBe('File Excel tidak dapat dibaca atau rusak');
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
      expect(json.error).toBe('INVALID_FORMAT');
      expect(json.message).toContain('Format file tidak sesuai');
      expect(json.missingColumns).toBeDefined();
    });

    it('should return 400 when file is empty', async () => {
      mockSheetToJson.mockReturnValueOnce([]);
      
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe('INVALID_FORMAT');
      expect(json.missingColumns).toContain('File kosong atau tidak memiliki data');
    });

    it('should successfully import valid data', async () => {
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toContain('Import berhasil');
      expect(json.details.successCount).toBe(1);
      expect(json.details.errorCount).toBe(0);
    });

    it('should create mustahiq record with correct data', async () => {
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as any;
      
      await POST(mockRequest);
      
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          nama: 'John Doe',
          jenis_kelamin: 'Laki-laki',
          tanggal_lahir: expect.any(Date),
          no_telepon: '08123456789',
          email: 'john@example.com',
          alamat: 'Jl. Contoh No. 123',
          status: 'active',
          created_by: mockUserId,
          created_at: expect.any(Date),
        },
      });
    });

    it('should create asnaf associations when asnaf data is provided', async () => {
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as any;
      
      await POST(mockRequest);
      
      expect(mockFindFirst).toHaveBeenCalledWith({ where: { type: 'Fakir' } });
      expect(mockFindFirst).toHaveBeenCalledWith({ where: { type: 'Miskin' } });
      expect(mockCreateMustahiqAsnaf).toHaveBeenCalledWith({
        data: {
          mustahiqId: mockMustahiqRecord.id,
          asnafId: 1,
        },
      });
    });

    it('should handle empty name field with error', async () => {
      const invalidData = [{
        ...mockExcelData[0],
        'Nama PM': '',
      }];
      mockSheetToJson.mockReturnValueOnce(invalidData);
      
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.message).toBe('Tidak ada data yang berhasil diimport');
      expect(json.details.errorCount).toBe(1);
      expect(json.details.errors[0]).toContain('Nama PM tidak boleh kosong');
    });

    it('should handle mixed success and error results', async () => {
      const mixedData = [
        mockExcelData[0],
        { ...mockExcelData[0], 'Nama PM': '' }, // This will fail
      ];
      mockSheetToJson.mockReturnValueOnce(mixedData);
      
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(207);
      expect(json.message).toContain('Import selesai dengan hasil campuran');
      expect(json.details.successCount).toBe(1);
      expect(json.details.errorCount).toBe(1);
    });

    it('should handle database errors gracefully', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Database error'));
      
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.message).toBe('Tidak ada data yang berhasil diimport');
      expect(json.details.errorCount).toBe(1);
    });

    it('should handle multiple records correctly', async () => {
      const multipleData = [
        mockExcelData[0],
        {
          ...mockExcelData[0],
          'ID PM': 2,
          'Nama PM': 'Jane Doe',
          'Jenis Kelamin': 'Perempuan',
          'Asnaf': 'Gharim',
        },
      ];
      mockSheetToJson.mockReturnValueOnce(multipleData);
      mockCreate.mockResolvedValueOnce(mockMustahiqRecord);
      mockCreate.mockResolvedValueOnce({ ...mockMustahiqRecord, id: 2, nama: 'Jane Doe' });
      
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json.details.successCount).toBe(2);
      expect(json.details.errorCount).toBe(0);
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should handle optional fields correctly', async () => {
      const dataWithEmptyFields = [{
        'ID PM': 1,
        'Nama PM': 'John Doe',
        'Jenis Kelamin': 'Laki-laki',
        'Tgl Lahir': '',
        'HP': '',
        'Email': '',
        'Alamat': '',
        'Asnaf': '',
        'Tgl Reg': '',
        'ID PJ': '',
      }];
      mockSheetToJson.mockReturnValueOnce(dataWithEmptyFields);
      
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as any;
      
      await POST(mockRequest);
      
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          nama: 'John Doe',
          jenis_kelamin: 'Laki-laki',
          tanggal_lahir: null,
          no_telepon: '',
          email: '',
          alamat: '',
          status: 'active',
          created_by: mockUserId,
          created_at: expect.any(Date),
        },
      });
    });

    it('should limit error messages to 10 items', async () => {
      const manyErrorsData = Array.from({ length: 15 }, (_, i) => ({
        ...mockExcelData[0],
        'Nama PM': '', // This will cause error
        'ID PM': i + 1,
      }));
      mockSheetToJson.mockReturnValueOnce(manyErrorsData);
      
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(mockFormData),
      } as any;
      
      const response = await POST(mockRequest);
      const json = await response.json();
      
      expect(json.details.errors.length).toBe(10);
      expect(json.details.errorCount).toBe(15);
    });
  });
});