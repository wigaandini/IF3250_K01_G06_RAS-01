import { GET } from '../../app/api/mustahiq/eksport/route';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import ExcelJS from 'exceljs';

// Use vi.hoisted to ensure these are available during mocking
const { 
  mockFindMany, 
  mockJwtVerify, 
  mockCookiesGet,
  mockWorksheet,
  mockWorkbook,
  mockExcelJSConstructor
} = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockJwtVerify: vi.fn(),
  mockCookiesGet: vi.fn(),
  mockWorksheet: {
    columns: [],
    addRow: vi.fn(),
  },
  mockWorkbook: {
    addWorksheet: vi.fn(),
    xlsx: {
      writeBuffer: vi.fn(),
    },
  },
  mockExcelJSConstructor: vi.fn(),
}));

// Mock Prisma client
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn(() => ({
      mustahiq: {
        findMany: mockFindMany,
      },
      $disconnect: vi.fn(),
    })),
  };
});

// Mock ExcelJS
vi.mock('exceljs', () => {
  return {
    default: {
      Workbook: mockExcelJSConstructor,
    },
    Workbook: mockExcelJSConstructor,
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

describe('Mustahiq Export API Endpoint', () => {
  const mockUserId = 1;
  const mockMustahiqRecords = [
    {
      id: 1,
      nama: 'John Doe',
      jenis_kelamin: 'Laki-laki',
      tanggal_lahir: new Date('1990-01-01'),
      no_telepon: '08123456789',
      email: 'john@example.com',
      alamat: 'Jl. Contoh No. 123',
      created_at: new Date('2023-01-01'),
      created_by: 1,
      asnafs: [
        {
          asnaf: {
            type: 'Fakir',
          },
        },
        {
          asnaf: {
            type: 'Miskin',
          },
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset ExcelJS mock
    mockExcelJSConstructor.mockReturnValue(mockWorkbook);
    mockWorkbook.addWorksheet.mockReturnValue(mockWorksheet);
    mockWorkbook.xlsx.writeBuffer.mockResolvedValue(new ArrayBuffer(8));
    
    // Mock jwtVerify to return a valid user ID by default
    mockJwtVerify.mockResolvedValue({
      payload: { id: mockUserId }
    });
    
    // Mock cookies to return a token by default
    mockCookiesGet.mockReturnValue({
      value: 'mock-token'
    });
    
    // Mock Prisma response
    mockFindMany.mockResolvedValue(mockMustahiqRecords);

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

    // Mock successful Excel file response
    const mockResponse = {
      status: 200,
      headers: new Map(),
      arrayBuffer: async () => new ArrayBuffer(8),
    };
    mockResponse.headers.set = vi.fn();
    mockResponse.headers.get = vi.fn((key: string) => {
      if (key === 'Content-Type') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (key === 'Content-Disposition') return 'attachment; filename=DataMustahiq.xlsx';
      return null;
    });
    
    // Mock the Response constructor that NextResponse likely uses
    global.Response = vi.fn().mockImplementation((body, init) => mockResponse) as any;
  });

  describe('GET endpoint', () => {
    it('should return 401 when no token is provided', async () => {
      mockCookiesGet.mockReturnValueOnce(undefined);
      
      const response = await GET();
      const json = await response.json();
      
      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('should return Excel file with correct headers when authorized', async () => {
      const response = await GET();
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(response.headers.get('Content-Disposition')).toBe(
        'attachment; filename=DataMustahiq.xlsx'
      );
    });

    it('should query database with correct parameters', async () => {
      await GET();
      
      expect(mockFindMany).toHaveBeenCalledWith({
        include: {
          asnafs: {
            include: {
              asnaf: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    });

    it('should create Excel worksheet with correct columns', async () => {
      await GET();
      
      expect(mockExcelJSConstructor).toHaveBeenCalled();
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Mustahiq');
      expect(mockWorksheet.columns).toEqual([
        { header: 'ID PM', key: 'id', width: 15 },
        { header: 'Nama PM', key: 'nama', width: 25 },
        { header: 'Jenis Kelamin', key: 'jenis_kelamin', width: 15 },
        { header: 'Tgl Lahir', key: 'tanggal_lahir', width: 15 },
        { header: 'HP', key: 'no_telepon', width: 15 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Alamat', key: 'alamat', width: 20 },
        { header: 'Asnaf', key: 'asnaf', width: 15 },
        { header: 'Tgl Reg', key: 'created_at', width: 15 },
        { header: 'ID PJ', key: 'id_pj', width: 15 },
      ]);
    });

    it('should add rows to worksheet with correct data', async () => {
      await GET();
      
      expect(mockWorksheet.addRow).toHaveBeenCalledWith({
        id: 1,
        nama: 'John Doe',
        jenis_kelamin: 'Laki-laki',
        tanggal_lahir: '1990-01-01',
        no_telepon: '08123456789',
        email: 'john@example.com',
        alamat: 'Jl. Contoh No. 123',
        asnaf: 'Fakir, Miskin',
        created_at: '2023-01-01',
        id_pj: 1,
      });
    });

    it('should handle empty optional fields correctly', async () => {
      const emptyRecord = {
        id: 2,
        nama: 'Jane Doe',
        jenis_kelamin: 'Perempuan',
        tanggal_lahir: null,
        no_telepon: null,
        email: null,
        alamat: null,
        created_at: new Date('2023-02-01'),
        created_by: null,
        asnafs: [],
      };
      
      mockFindMany.mockResolvedValueOnce([...mockMustahiqRecords, emptyRecord]);
      
      await GET();
      
      expect(mockWorksheet.addRow).toHaveBeenCalledWith({
        id: 2,
        nama: 'Jane Doe',
        jenis_kelamin: 'Perempuan',
        tanggal_lahir: '',
        no_telepon: '',
        email: '',
        alamat: '',
        asnaf: '',
        created_at: '2023-02-01',
        id_pj: '',
      });
    });

    it('should return 500 when database query fails', async () => {
      mockFindMany.mockRejectedValueOnce(new Error('Database error'));
      
      const response = await GET();
      const json = await response.json();
      
      expect(response.status).toBe(500);
      expect(json.error).toBe('Gagal membuat file Excel');
    });

    it('should return 500 when Excel generation fails', async () => {
      mockWorkbook.xlsx.writeBuffer.mockRejectedValueOnce(new Error('Excel error'));
      
      const response = await GET();
      const json = await response.json();
      
      expect(response.status).toBe(500);
      expect(json.error).toBe('Gagal membuat file Excel');
    });

    it('should handle empty data correctly', async () => {
      mockFindMany.mockResolvedValueOnce([]);
      
      const response = await GET();
      
      expect(response.status).toBe(200);
      expect(mockWorksheet.addRow).not.toHaveBeenCalled();
      expect(mockWorkbook.xlsx.writeBuffer).toHaveBeenCalled();
    });

    it('should handle multiple records correctly', async () => {
      const multipleRecords = [
        ...mockMustahiqRecords,
        {
          id: 2,
          nama: 'Jane Doe',
          jenis_kelamin: 'Perempuan',
          tanggal_lahir: new Date('1995-05-15'),
          no_telepon: '08987654321',
          email: 'jane@example.com',
          alamat: 'Jl. Test No. 456',
          created_at: new Date('2023-02-01'),
          created_by: 2,
          asnafs: [
            {
              asnaf: {
                type: 'Gharim',
              },
            },
          ],
        }
      ];
      mockFindMany.mockResolvedValueOnce(multipleRecords);
      
      await GET();
      
      expect(mockWorksheet.addRow).toHaveBeenCalledTimes(2);
      expect(mockWorksheet.addRow).toHaveBeenNthCalledWith(1, {
        id: 1,
        nama: 'John Doe',
        jenis_kelamin: 'Laki-laki',
        tanggal_lahir: '1990-01-01',
        no_telepon: '08123456789',
        email: 'john@example.com',
        alamat: 'Jl. Contoh No. 123',
        asnaf: 'Fakir, Miskin',
        created_at: '2023-01-01',
        id_pj: 1,
      });
      expect(mockWorksheet.addRow).toHaveBeenNthCalledWith(2, {
        id: 2,
        nama: 'Jane Doe',
        jenis_kelamin: 'Perempuan',
        tanggal_lahir: '1995-05-15',
        no_telepon: '08987654321',
        email: 'jane@example.com',
        alamat: 'Jl. Test No. 456',
        asnaf: 'Gharim',
        created_at: '2023-02-01',
        id_pj: 2,
      });
    });

    it('should call Excel writeBuffer method', async () => {
      await GET();
      
      expect(mockWorkbook.xlsx.writeBuffer).toHaveBeenCalled();
    });
  });
});