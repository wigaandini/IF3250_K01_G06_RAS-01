import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '../../app/api/program/route';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const { 
  mockFindMany, 
  mockJwtVerify, 
  mockCookiesGet,
  mockWorksheet,
  mockWorkbook,
  mockCreate,
  mockAggregate,
  mockCreateMany,
  mockDisconnect,
  mockExcelJSConstructor
} = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockAggregate: vi.fn(),
  mockCreate: vi.fn(),
  mockCreateMany: vi.fn(),
  mockDisconnect: vi.fn(),
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

// Mock PrismaClient
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn(() => ({
      program_Bantuan: {
        findMany: mockFindMany,
        create: mockCreate,
      },
      parameterField: {
        create: mockCreate,
      },
      penyaluran: {
        findMany: mockFindMany,
      },
      programSumberDana: {
        aggregate: mockAggregate,
        createMany: mockCreateMany,
      },
      $disconnect: mockDisconnect,
    })),
    Prisma: {
      DbNull: Symbol.for('Prisma.DbNull'),
    }
  };
});

// Mock request object for POST tests
const mockRequest = {
  json: vi.fn().mockResolvedValue({
    nama_program: 'Test Program',
    bidang_kategori: 'Education',
    sumber_dana: 'Government',
    parameterFields: []
  })
} as any;

describe('Program Route Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // GET Tests
  describe('GET', () => {
    it('should return programs ordered by created_at desc', async () => {
      const mockPrograms = [
        { id: 1, nama_program: 'Program 1' },
        { id: 2, nama_program: 'Program 2' }
      ];
      
      // Mock program_Bantuan.findMany to return programs
      mockFindMany.mockImplementation((query) => {
        if (query && query.include && query.include.ParameterField) {
          return Promise.resolve(mockPrograms);
        }
        // For penyaluran.findMany calls
        return Promise.resolve([]);
      });
      
      // Mock programSumberDana.aggregate to return 0 total
      mockAggregate.mockResolvedValue({
        _sum: { nominal: 0 }
      });
      
      const response = await GET();
      expect(response.status).toBe(200);
      const json = await response.json();
      
      // Check that enriched data is returned
      expect(json).toHaveLength(2);
      expect(json[0]).toHaveProperty('jumlah_mustahiq_dibantu', 0);
      expect(json[0]).toHaveProperty('nominal_terpakai', 0);
      expect(json[0]).toHaveProperty('total_nominal', 0);
    });

    it('should return enriched data with penyaluran info', async () => {
      const mockPrograms = [
        { id: 1, nama_program: 'Program 1' }
      ];
      
      const mockPenyaluran = [
        { mustahiq_id: 1, jumlah: 100000 },
        { mustahiq_id: 2, jumlah: 150000 },
        { mustahiq_id: 1, jumlah: 50000 } // Same mustahiq_id, should not double count
      ];
      
      // Mock different behavior for different calls
      mockFindMany.mockImplementation((query) => {
        if (query && query.include && query.include.ParameterField) {
          return Promise.resolve(mockPrograms);
        }
        // For penyaluran.findMany calls
        return Promise.resolve(mockPenyaluran);
      });
      
      mockAggregate.mockResolvedValue({
        _sum: { nominal: 500000 }
      });
      
      const response = await GET();
      expect(response.status).toBe(200);
      const json = await response.json();
      
      expect(json[0].jumlah_mustahiq_dibantu).toBe(2); // Unique mustahiq count
      expect(json[0].nominal_terpakai).toBe(300000); // Sum of all jumlah
      expect(json[0].total_nominal).toBe(500000);
    });

    it('should return 500 on database error', async () => {
      mockFindMany.mockRejectedValue(new Error('DB error'));
      const response = await GET();
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Internal Server Error');
    });
  });

  // POST Tests
  describe('POST', () => {
    it('should create program successfully', async () => {
      const mockNewProgram = { id: 1, nama_program: 'New Program' };
      mockCreate.mockResolvedValue(mockNewProgram);
      
      const response = await POST(mockRequest);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.message).toBe('Program created successfully');
      expect(json.program).toEqual(mockNewProgram);
    });

    it('should handle parameter fields creation', async () => {
      const mockNewProgram = { id: 1, nama_program: 'New Program' };
      const mockParameterFields = [
        { field_name: 'test', field_type: 'text' }
      ];
      
      mockRequest.json = vi.fn().mockResolvedValue({
        nama_program: 'New Program',
        bidang_kategori: 'Education',
        sumber_dana: 'Government',
        parameterFields: mockParameterFields
      });
      
      mockCreate.mockResolvedValue(mockNewProgram);
      
      const response = await POST(mockRequest);
      expect(response.status).toBe(200);
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should handle sumber_dana_list creation', async () => {
      const mockNewProgram = { id: 1, nama_program: 'New Program' };
      const mockSumberDanaList = [
        { sumber_dana: 'Government', nominal: 1000000 }
      ];
      
      mockRequest.json = vi.fn().mockResolvedValue({
        nama_program: 'New Program',
        bidang_kategori: 'Education',
        sumber_dana_list: mockSumberDanaList,
        parameterFields: []
      });
      
      mockCreate.mockResolvedValue(mockNewProgram);
      
      const response = await POST(mockRequest);
      expect(response.status).toBe(200);
      expect(mockCreateMany).toHaveBeenCalled();
    });

    it('should handle date conversion for tanggal_mulai and tanggal_selesai', async () => {
      const mockNewProgram = { id: 1, nama_program: 'New Program' };
      const dateString = '2023-01-01';
      
      mockRequest.json = vi.fn().mockResolvedValue({
        nama_program: 'New Program',
        bidang_kategori: 'Education',
        sumber_dana: 'Government',
        tanggal_mulai: dateString,
        tanggal_selesai: dateString,
        parameterFields: []
      });
      
      mockCreate.mockResolvedValue(mockNewProgram);
      
      await POST(mockRequest);
      const createCall = mockCreate.mock.calls[0][0];
      expect(createCall.data.tanggal_mulai).toEqual(new Date(dateString));
      expect(createCall.data.tanggal_selesai).toEqual(new Date(dateString));
    });

    it('should return 500 on database error', async () => {
      mockCreate.mockRejectedValue(new Error('DB error'));
      const response = await POST(mockRequest);
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Internal Server Error');
    });
  });
});