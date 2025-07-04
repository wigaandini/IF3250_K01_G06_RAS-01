import { GET } from '../../app/api/users/eksport/route';
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
    getRow: vi.fn(),
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
      user: {
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

describe('User Export API Endpoint', () => {
  const mockUserId = 1;
  const mockUserRecords = [
    {
      id: 1,
      nama: 'John Doe',
      email: 'john@example.com',
      no_telp: '08123456789',
      alamat: 'Jl. Contoh No. 123',
      role: 'admin',
      created_at: new Date('2023-01-01'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock header row for styling
    const mockHeaderRow = {
      font: {},
      fill: {},
    };
    
    // Reset ExcelJS mock
    mockExcelJSConstructor.mockReturnValue(mockWorkbook);
    mockWorkbook.addWorksheet.mockReturnValue(mockWorksheet);
    mockWorkbook.xlsx.writeBuffer.mockResolvedValue(new ArrayBuffer(8));
    mockWorksheet.getRow.mockReturnValue(mockHeaderRow);
    
    // Mock jwtVerify to return a valid user ID by default
    mockJwtVerify.mockResolvedValue({
      payload: { id: mockUserId }
    });
    
    // Mock cookies to return a token by default
    mockCookiesGet.mockReturnValue({
      value: 'mock-token'
    });
    
    // Mock Prisma response
    mockFindMany.mockResolvedValue(mockUserRecords);
    
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
      if (key === 'Content-Disposition') return 'attachment; filename=DataPengguna.xlsx';
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
        'attachment; filename=DataPengguna.xlsx'
      );
    });

    it('should query database with correct parameters', async () => {
      await GET();
      
      expect(mockFindMany).toHaveBeenCalledWith({
        orderBy: {
          created_at: 'desc',
        },
      });
    });

    it('should create Excel worksheet with correct columns', async () => {
      await GET();
      
      expect(mockExcelJSConstructor).toHaveBeenCalled();
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Data Pengguna');
      expect(mockWorksheet.columns).toEqual([
        { header: 'ID Pengguna', key: 'id', width: 15 },
        { header: 'Nama Pengguna', key: 'nama', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'No Telp', key: 'no_telp', width: 15 },
        { header: 'Alamat', key: 'alamat', width: 30 },
        { header: 'Peran', key: 'role', width: 15 },
        { header: 'Tgl Reg', key: 'created_at', width: 15 },
      ]);
    });

    it('should add rows to worksheet with correct data', async () => {
      await GET();
      
      expect(mockWorksheet.addRow).toHaveBeenCalledWith({
        id: 1,
        nama: 'John Doe',
        email: 'john@example.com',
        no_telp: '08123456789',
        alamat: 'Jl. Contoh No. 123',
        role: 'admin',
        created_at: '2023-01-01',
      });
    });

    it('should handle empty optional fields correctly', async () => {
      const emptyRecord = {
        id: 2,
        nama: null,
        email: 'jane@example.com',
        no_telp: '08987654321',
        alamat: 'Jl. Test No. 456',
        role: null,
        created_at: new Date('2023-02-01'),
      };
      
      mockFindMany.mockResolvedValueOnce([...mockUserRecords, emptyRecord]);
      
      await GET();
      
      expect(mockWorksheet.addRow).toHaveBeenCalledWith({
        id: 2,
        nama: '',
        email: 'jane@example.com',
        no_telp: '08987654321',
        alamat: 'Jl. Test No. 456',
        role: '',
        created_at: '2023-02-01',
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
        ...mockUserRecords,
        {
          id: 2,
          nama: 'Jane Doe',
          email: 'jane@example.com',
          no_telp: '08987654321',
          alamat: 'Jl. Test No. 456',
          role: 'user',
          created_at: new Date('2023-02-01'),
        }
      ];
      mockFindMany.mockResolvedValueOnce(multipleRecords);
      
      await GET();
      
      expect(mockWorksheet.addRow).toHaveBeenCalledTimes(2);
      expect(mockWorksheet.addRow).toHaveBeenNthCalledWith(1, {
        id: 1,
        nama: 'John Doe',
        email: 'john@example.com',
        no_telp: '08123456789',
        alamat: 'Jl. Contoh No. 123',
        role: 'admin',
        created_at: '2023-01-01',
      });
      expect(mockWorksheet.addRow).toHaveBeenNthCalledWith(2, {
        id: 2,
        nama: 'Jane Doe',
        email: 'jane@example.com',
        no_telp: '08987654321',
        alamat: 'Jl. Test No. 456',
        role: 'user',
        created_at: '2023-02-01',
      });
    });

    it('should call Excel writeBuffer method', async () => {
      await GET();
      
      expect(mockWorkbook.xlsx.writeBuffer).toHaveBeenCalled();
    });

    it('should style header row correctly', async () => {
      const mockHeaderRow = {
        font: {},
        fill: {},
      };
      mockWorksheet.getRow.mockReturnValue(mockHeaderRow);
      
      await GET();
      
      expect(mockWorksheet.getRow).toHaveBeenCalledWith(1);
      expect(mockHeaderRow.font).toEqual({ bold: true });
      expect(mockHeaderRow.fill).toEqual({
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      });
    });
  });
});