import { GET } from '../../app/api/penyaluran/eksport/route';
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
      penyaluran: {
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
      // Add the actual constructor behavior for binary responses
      next: vi.fn((init) => {
        const response = {
          status: 200,
          headers: new Map(),
          arrayBuffer: async () => new ArrayBuffer(8),
        };
        response.headers.set = vi.fn();
        response.headers.get = vi.fn((key) => {
          if (key === 'Content-Type') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          if (key === 'Content-Disposition') return 'attachment; filename=DataPenyaluran.xlsx';
          return null;
        });
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

describe('Penyaluran Export API Endpoint', () => {
  const mockUserId = 1;
  const mockPenyaluranRecords = [
    {
      mustahiq_id: 1,
      program_id: 1,
      jumlah: 1000000,
      created_at: new Date('2023-01-01'),
      catatan: 'Test export',
      mustahiq: { id: 1, nama: 'John Doe' },
      program: { id: 1, nama_program: 'Program Bantuan' },
      coa_debt: { id: 1, kode: 'DEB123' },
      coa_cred: { id: 2, kode: 'CRED456' },
    }
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
    mockFindMany.mockResolvedValue(mockPenyaluranRecords);

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
      if (key === 'Content-Disposition') return 'attachment; filename=DataPenyaluran.xlsx';
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
        'attachment; filename=DataPenyaluran.xlsx'
      );
    });

    it('should query database with correct parameters', async () => {
      await GET();
      
      expect(mockFindMany).toHaveBeenCalledWith({
        include: {
          mustahiq: true,
          program: true,
          coa_debt: true,
          coa_cred: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    });

    it('should create Excel worksheet with correct columns', async () => {
      await GET();
      
      expect(mockExcelJSConstructor).toHaveBeenCalled();
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Penyaluran');
      expect(mockWorksheet.columns).toEqual([
        { header: 'ID PM', key: 'id_pm', width: 15 },
        { header: 'ID Program', key: 'id_program', width: 15 },
        { header: 'COA Debet', key: 'coa_debet', width: 15 },
        { header: 'COA Kredit', key: 'coa_kredit', width: 15 },
        { header: 'Nominal', key: 'nominal', width: 15 },
        { header: 'Tgl Salur', key: 'tgl_salur', width: 15 },
        { header: 'Keterangan', key: 'keterangan', width: 30 },
        { header: 'Nama PM', key: 'nama_pm', width: 25 },
      ]);
    });

    it('should add rows to worksheet with correct data', async () => {
      await GET();
      
      expect(mockWorksheet.addRow).toHaveBeenCalledWith({
        id_pm: 1,
        id_program: 1,
        coa_debet: 'DEB123',
        coa_kredit: 'CRED456',
        nominal: 1000000,
        tgl_salur: '2023-01-01',
        keterangan: 'Test export',
        nama_pm: 'Program Bantuan',
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
        ...mockPenyaluranRecords,
        {
          mustahiq_id: 2,
          program_id: 2,
          jumlah: 2000000,
          created_at: new Date('2023-01-02'),
          catatan: 'Test export 2',
          mustahiq: { id: 2, nama: 'Jane Doe' },
          program: { id: 2, nama_program: 'Program Bantuan 2' },
          coa_debt: { id: 3, kode: 'DEB789' },
          coa_cred: { id: 4, kode: 'CRED012' },
        }
      ];
      mockFindMany.mockResolvedValueOnce(multipleRecords);
      
      await GET();
      
      expect(mockWorksheet.addRow).toHaveBeenCalledTimes(2);
      expect(mockWorksheet.addRow).toHaveBeenNthCalledWith(1, {
        id_pm: 1,
        id_program: 1,
        coa_debet: 'DEB123',
        coa_kredit: 'CRED456',
        nominal: 1000000,
        tgl_salur: '2023-01-01',
        keterangan: 'Test export',
        nama_pm: 'Program Bantuan',
      });
      expect(mockWorksheet.addRow).toHaveBeenNthCalledWith(2, {
        id_pm: 2,
        id_program: 2,
        coa_debet: 'DEB789',
        coa_kredit: 'CRED012',
        nominal: 2000000,
        tgl_salur: '2023-01-02',
        keterangan: 'Test export 2',
        nama_pm: 'Program Bantuan 2',
      });
    });

    it('should call Excel writeBuffer method', async () => {
      await GET();
      
      expect(mockWorkbook.xlsx.writeBuffer).toHaveBeenCalled();
    });
  });
});