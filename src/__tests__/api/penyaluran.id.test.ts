import { GET, PUT, DELETE } from '../../app/api/penyaluran/[id]/route';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

// Mock Prisma client
vi.mock('@prisma/client', () => {
  const mockFindUnique = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockDeleteMany = vi.fn();
  const mockCreate = vi.fn();
  
  const mockPrisma = {
    penyaluran: {
      findUnique: mockFindUnique,
      update: mockUpdate,
      delete: mockDelete,
    },
    parameterFieldValue: {
      deleteMany: mockDeleteMany,
      create: mockCreate,
    },
    $disconnect: vi.fn(),
  };
  return {
    PrismaClient: vi.fn(() => mockPrisma),
  };
});

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn().mockImplementation((body, options = {}) => ({
      status: options.status || 200,
      json: async () => body,
    })),
  },
}));

describe('Penyaluran [id] API Endpoint', () => {
  let prismaInstance: any;
  const mockPenyaluran = {
    id: 1,
    mustahiq_id: 1,
    program_id: 1,
    tanggal: new Date('2023-01-01'),
    jumlah: 1000000,
    catatan: 'Test catatan',
    status: 'completed',
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
    mustahiq: {
      id: 1,
      nama: 'John Doe',
      NIK: '1234567890123456',
      alamat: 'Jl. Test No. 123',
    },
    program: {
      id: 1,
      nama_program: 'Program Test',
      ParameterField: [
        {
          id: 1,
          field_name: 'Field 1',
          field_type: 'text',
          is_required: true,
          description: 'Test field',
        },
      ],
    },
    ParameterFieldValue: [
      {
        id: 1,
        field_id: 1,
        value: 'Test value',
      },
    ],
    creator: {
      id: 1,
      nama: 'Admin',
      email: 'admin@test.com',
    },
  };

  beforeAll(() => {
    prismaInstance = new PrismaClient();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET endpoint', () => {
    it('should return 400 for invalid ID', async () => {
      const response = await GET({} as NextRequest, { params: { id: 'invalid' } });
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe('Invalid ID');
    });

    it('should return 404 when penyaluran not found', async () => {
      (prismaInstance.penyaluran.findUnique as any).mockResolvedValue(null);
      
      const response = await GET({} as NextRequest, { params: { id: '999' } });
      const json = await response.json();
      
      expect(response.status).toBe(404);
      expect(json.error).toBe('Not found');
    });

    it('should return formatted penyaluran data', async () => {
      (prismaInstance.penyaluran.findUnique as any).mockResolvedValue(mockPenyaluran);
      
      const response = await GET({} as NextRequest, { params: { id: '1' } });
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json.id).toBe(1);
      expect(json.tanggal).toBe('2023-01-01');
      expect(json.parameter_values).toEqual([
        {
          id: 1,
          field_name: 'Field 1',
          field_type: 'text',
          is_required: true,
          description: 'Test field',
          value: 'Test value',
        },
      ]);
      expect(json.mustahiq).toEqual({
        id: 1,
        nama: 'John Doe',
        NIK: '1234567890123456',
        alamat: 'Jl. Test No. 123',
      });
    });

    it('should return 500 on database error', async () => {
      (prismaInstance.penyaluran.findUnique as any).mockRejectedValue(new Error('Database error'));
      
      const response = await GET({} as NextRequest, { params: { id: '1' } });
      const json = await response.json();
      
      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal Server Error');
    });
  });

  describe('PUT endpoint', () => {
    const mockUpdateData = {
      mustahiq_id: 1,
      program_id: 1,
      tanggal: '2023-01-01',
      jumlah: 2000000,
      catatan: 'Updated catatan',
      status: 'pending',
      parameterValues: [
        { field_id: 1, value: 'Updated value' },
      ],
    };

    it('should return 400 for invalid ID', async () => {
      const response = await PUT({} as NextRequest, { params: { id: 'invalid' } });
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe('Invalid ID');
    });

    it('should update penyaluran and parameter values', async () => {
      const mockUpdatedPenyaluran = { ...mockPenyaluran, jumlah: 2000000 };
      
      (prismaInstance.penyaluran.update as any).mockResolvedValue(mockUpdatedPenyaluran);
      (prismaInstance.parameterFieldValue.deleteMany as any).mockResolvedValue({ count: 1 });
      (prismaInstance.parameterFieldValue.create as any).mockResolvedValue({});
      
      const req = new Request('http://localhost/api/penyaluran/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData),
      });
      
      const response = await PUT(req, { params: { id: '1' } });
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json.message).toBe('Updated successfully');
      expect(prismaInstance.penyaluran.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          mustahiq_id: 1,
          program_id: 1,
          tanggal: new Date('2023-01-01'),
          jumlah: 2000000,
          catatan: 'Updated catatan',
          status: 'pending',
          updated_at: expect.any(Date),
          updated_by: null,
        },
      });
      expect(prismaInstance.parameterFieldValue.deleteMany).toHaveBeenCalledWith({
        where: { penyaluran_id: 1 },
      });
      expect(prismaInstance.parameterFieldValue.create).toHaveBeenCalledWith({
        data: {
          field_id: 1,
          program_id: 1,
          mustahiq_id: 1,
          penyaluran_id: 1,
          value: 'Updated value',
          created_at: expect.any(Date),
        },
      });
    });

    it('should return 500 on database error', async () => {
      (prismaInstance.penyaluran.update as any).mockRejectedValue(new Error('Database error'));
      
      const req = new Request('http://localhost/api/penyaluran/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData),
      });
      
      const response = await PUT(req, { params: { id: '1' } });
      const json = await response.json();
      
      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal Server Error');
    });
  });

  describe('DELETE endpoint', () => {
    it('should return 400 for invalid ID', async () => {
      const response = await DELETE({} as NextRequest, { params: { id: 'invalid' } });
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe('Invalid ID');
    });

    it('should delete penyaluran and parameter values', async () => {
      (prismaInstance.parameterFieldValue.deleteMany as any).mockResolvedValue({ count: 1 });
      (prismaInstance.penyaluran.delete as any).mockResolvedValue({ id: 1 });
      
      const response = await DELETE({} as NextRequest, { params: { id: '1' } });
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json.message).toBe('Deleted successfully');
      expect(prismaInstance.parameterFieldValue.deleteMany).toHaveBeenCalledWith({
        where: { penyaluran_id: 1 },
      });
      expect(prismaInstance.penyaluran.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return 500 on database error', async () => {
      (prismaInstance.penyaluran.delete as any).mockRejectedValue(new Error('Database error'));
      
      const response = await DELETE({} as NextRequest, { params: { id: '1' } });
      const json = await response.json();
      
      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal Server Error');
    });
  });
});