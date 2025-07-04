global.File = class File {
  name: string;
  type: string;
  data: any;
  size: number;
  constructor(bits: any[], name: string, options: { type: string }) {
    this.name = name;
    this.type = options.type;
    this.data = bits;
    this.size = bits.reduce((acc, chunk) => acc + (chunk.length ?? 0), 0);
  }
};

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { GET, PUT, DELETE } from '../../app/api/mustahiq/[id]/route';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

// Mock NextResponse properly
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn().mockImplementation((body, options = {}) => {
      const response = {
        status: options.status || 200,
        json: vi.fn().mockResolvedValue(body),
        ok: (options.status || 200) >= 200 && (options.status || 200) < 300
      };
      return response;
    })
  }
}));

// Mock jose
vi.mock('jose', () => ({
  jwtVerify: vi.fn()
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn()
  }))
}));

// Mock Prisma
vi.mock('@prisma/client', () => {
  const mockFindUnique = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockDeleteMany = vi.fn();
  const mockCreate = vi.fn();
  
  const mockPrisma = {
    mustahiq: {
      findUnique: mockFindUnique,
      update: mockUpdate,
      delete: mockDelete
    },
    mustahiqAsnaf: {
      deleteMany: mockDeleteMany,
      create: mockCreate
    },
    mustahiqKondisiFoto: {
      deleteMany: mockDeleteMany
    },
    mustahiqProgram: {
      deleteMany: mockDeleteMany
    },
    parameterFieldValue: {
      deleteMany: mockDeleteMany
    },
    asnaf: {
      findUnique: vi.fn()
    },
    user: {
      findUnique: vi.fn()
    }
  };
  
  return {
    PrismaClient: vi.fn(() => mockPrisma)
  };
});

import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

describe('Mustahiq API Endpoint', () => {
  let prismaInstance: any;
  let originalEnv: NodeJS.ProcessEnv;
  
  const mockMustahiq = {
    id: 1,
    nama: 'John Doe',
    NIK: '1234567890123456',
    jenis_kelamin: 'Laki-laki',
    tempat_lahir: 'Jakarta',
    tanggal_lahir: new Date('1990-01-01'),
    no_telepon: '08123456789',
    email: 'john@example.com',
    alamat: 'Jl. Contoh No. 123',
    provinsi_id: 1,
    kabupaten_id: 1,
    kecamatan_id: 1,
    kelurahan_id: 1,
    provinsi: 'DKI Jakarta',
    kabupaten: 'Jakarta Selatan',
    kecamatan: 'Pancoran',
    kelurahan: 'Kalibata',
    kode_pos: '12345',
    GPS_lat: '-6.2088',
    GPS_long: '106.8456',
    status_pernikahan: 'Menikah',
    pekerjaan: 'Karyawan Swasta',
    agama: 'Islam',
    pendidikan_terakhir: 'S1',
    jumlah_anggota_kk: 4,
    foto_kk: null,
    foto_ktp: null,
    foto_mustahiq: null,
    created_by: 1,
    updated_by: 1,
    created_at: new Date('2023-01-01T00:00:00Z'),
    updated_at: new Date('2023-01-01T00:00:00Z'),
    asnafs: [
      {
        asnaf: {
          id: 1,
          type: 'Fakir'
        }
      }
    ],
    creator: {
      id: 1,
      nama: 'Admin',
      email: 'admin@example.com'
    },
    updater: {
      id: 1,
      nama: 'Admin',
      email: 'admin@example.com'
    },
    bantuans: []
  };

  beforeAll(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv, JWT_SECRET: 'test_secret_key' };
    prismaInstance = new PrismaClient();
  });

  afterAll(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset all mocks to successful states
    const mockCookies = {
      get: vi.fn(() => ({ value: 'fake-token' }))
    };
    (cookies as vi.Mock).mockReturnValue(mockCookies);
    
    // Mock successful JWT verification
    (jwtVerify as vi.Mock).mockResolvedValue({
      payload: {
        id: 1,
        email: 'admin@example.com',
        role: 'admin'
      }
    });
    
    // Mock user role
    (prismaInstance.user.findUnique as any).mockResolvedValue({
      role: 'superadmin'
    });
    
    // Reset Prisma mocks to default successful responses
    (prismaInstance.mustahiq.findUnique as any).mockResolvedValue(mockMustahiq);
    (prismaInstance.mustahiq.update as any).mockResolvedValue(mockMustahiq);
    (prismaInstance.mustahiq.delete as any).mockResolvedValue({ id: 1 });
    (prismaInstance.mustahiqAsnaf.deleteMany as any).mockResolvedValue({ count: 1 });
    (prismaInstance.mustahiqKondisiFoto.deleteMany as any).mockResolvedValue({ count: 0 });
    (prismaInstance.mustahiqProgram.deleteMany as any).mockResolvedValue({ count: 0 });
    (prismaInstance.parameterFieldValue.deleteMany as any).mockResolvedValue({ count: 0 });
    (prismaInstance.asnaf.findUnique as any).mockResolvedValue({ id: 1, type: 'Fakir' });
  });

  describe('GET endpoint', () => {
    it('should return 400 with invalid ID format', async () => {
      const req = new Request('http://localhost/api/mustahiq/invalid-id');
      const response = await GET(req, { params: { id: 'invalid-id' } });
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe('Invalid ID format');
    });

    it('should return 404 when mustahiq is not found', async () => {
      (prismaInstance.mustahiq.findUnique as any).mockResolvedValue(null);
      
      const req = new Request('http://localhost/api/mustahiq/123');
      const response = await GET(req, { params: { id: '123' } });
      const json = await response.json();
      
      expect(response.status).toBe(404);
      expect(json.error).toBe('Data not found');
    });

    it('should return 200 with transformed mustahiq data', async () => {
      // Ensure the mock returns the expected data
      (prismaInstance.mustahiq.findUnique as any).mockResolvedValue(mockMustahiq);
      
      const req = new Request('http://localhost/api/mustahiq/1');
      const response = await GET(req, { params: { id: '1' } });
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json.id).toBe(1);
      expect(json.nama).toBe('John Doe');
      expect(json.provinsi).toBe('DKI Jakarta');
      expect(json.asnafs[0].type).toBe('Fakir');
      expect(json.created_by.nama).toBe('Admin');
    });

    it('should return 500 when an error occurs', async () => {
      (prismaInstance.mustahiq.findUnique as any).mockRejectedValue(new Error('Database error'));
      
      const req = new Request('http://localhost/api/mustahiq/1');
      const response = await GET(req, { params: { id: '1' } });
      const json = await response.json();
      
      expect(response.status).toBe(500);
      expect(json.error).toBe('Failed to fetch data');
    });
  });

  describe('PUT endpoint', () => {
    const createMockFormData = () => {
      const mockFormData = new FormData();
      mockFormData.append('nama', 'Updated Name');
      mockFormData.append('NIK', '1234567890123456');
      mockFormData.append('jenis_kelamin', 'Laki-laki');
      return mockFormData;
    };

    it('should return 401 when unauthorized', async () => {
      (jwtVerify as vi.Mock).mockRejectedValue(new Error('Invalid token'));
      
      const req = new Request('http://localhost/api/mustahiq/1', { method: 'PUT' });
      vi.spyOn(req, 'formData').mockResolvedValue(createMockFormData());
      
      const response = await PUT(req, { params: { id: '1' } });
      const json = await response.json();
      
      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('should return 400 with invalid ID format', async () => {
      const req = new Request('http://localhost/api/mustahiq/invalid-id', { method: 'PUT' });
      vi.spyOn(req, 'formData').mockResolvedValue(createMockFormData());
      
      const response = await PUT(req, { params: { id: 'invalid-id' } });
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe('Invalid ID format');
    });

    it('should return 200 with updated mustahiq data', async () => {
      const updatedMustahiq = {
        id: 1,
        nama: 'Updated Name',
        NIK: '1234567890123456'
      };
      
      (prismaInstance.mustahiq.update as any).mockResolvedValue(updatedMustahiq);
      
      const req = new Request('http://localhost/api/mustahiq/1', { method: 'PUT' });
      vi.spyOn(req, 'formData').mockResolvedValue(createMockFormData());
      
      const response = await PUT(req, { params: { id: '1' } });
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.nama).toBe('Updated Name');
    });

    it('should handle file uploads correctly', async () => {
      const testFormData = new FormData();
      testFormData.append('nama', 'Test User');
      
      const testFile = new File(['file content'], 'test.jpg', { type: 'image/jpeg' });
      testFormData.append('foto_ktp', testFile);
      
      const updatedData = { 
        id: 1, 
        nama: 'Test User',
        foto_ktp: '/uploads/test.jpg' // Simulate file path
      };
      
      (prismaInstance.mustahiq.update as any).mockResolvedValue(updatedData);
      
      const req = new Request('http://localhost/api/mustahiq/1', { method: 'PUT' });
      vi.spyOn(req, 'formData').mockResolvedValue(testFormData);
      
      const response = await PUT(req, { params: { id: '1' } });
      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.data.nama).toBe('Test User');
      
      const updateCall = (prismaInstance.mustahiq.update as any).mock.calls[0][0];
      expect(updateCall).toBeDefined();
      expect(updateCall.where).toEqual({ id: 1 });
      expect(updateCall.data.nama).toBe('Test User');
    });

    it('should return 500 when an error occurs', async () => {
      (prismaInstance.mustahiq.update as any).mockRejectedValue(new Error('Database error'));
      
      const req = new Request('http://localhost/api/mustahiq/1', { method: 'PUT' });
      vi.spyOn(req, 'formData').mockResolvedValue(createMockFormData());
      
      const response = await PUT(req, { params: { id: '1' } });
      const json = await response.json();
      
      expect(response.status).toBe(500);
      expect(json.error).toBe('Failed to update data');
    });
  });

  describe('DELETE endpoint', () => {
    it('should return 401 when unauthorized', async () => {
      (jwtVerify as vi.Mock).mockRejectedValue(new Error('Invalid token'));
      
      const req = new Request('http://localhost/api/mustahiq/1', { method: 'DELETE' });
      const response = await DELETE(req, { params: { id: '1' } });
      const json = await response.json();
      
      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('should return 400 with invalid ID format', async () => {
      const req = new Request('http://localhost/api/mustahiq/invalid-id', { method: 'DELETE' });
      const response = await DELETE(req, { params: { id: 'invalid-id' } });
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe('Invalid ID format');
    });

    it('should return 200 when mustahiq is deleted successfully', async () => {
      // Ensure all required mocks are set up
      (prismaInstance.user.findUnique as any).mockResolvedValue({ role: 'superadmin' });
      (prismaInstance.mustahiqAsnaf.deleteMany as any).mockResolvedValue({ count: 1 });
      (prismaInstance.mustahiqKondisiFoto.deleteMany as any).mockResolvedValue({ count: 0 });
      (prismaInstance.mustahiqProgram.deleteMany as any).mockResolvedValue({ count: 0 });
      (prismaInstance.parameterFieldValue.deleteMany as any).mockResolvedValue({ count: 0 });
      (prismaInstance.mustahiq.delete as any).mockResolvedValue({ id: 1 });
      
      const req = new Request('http://localhost/api/mustahiq/1', { method: 'DELETE' });
      const response = await DELETE(req, { params: { id: '1' } });
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(prismaInstance.mustahiqAsnaf.deleteMany).toHaveBeenCalledWith({
        where: { mustahiqId: 1 }
      });
      expect(prismaInstance.mustahiq.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return 403 when user role is not authorized', async () => {
      (prismaInstance.user.findUnique as any).mockResolvedValue({ role: 'user' });
      
      const req = new Request('http://localhost/api/mustahiq/1', { method: 'DELETE' });
      const response = await DELETE(req, { params: { id: '1' } });
      const json = await response.json();
      
      expect(response.status).toBe(403);
      expect(json.error).toBe('Forbidden - Insufficient permissions');
    });

    it('should return 500 when an error occurs', async () => {
      (prismaInstance.user.findUnique as any).mockResolvedValue({ role: 'superadmin' });
      (prismaInstance.mustahiqAsnaf.deleteMany as any).mockResolvedValue({ count: 1 });
      (prismaInstance.mustahiq.delete as any).mockRejectedValue(new Error('Database error'));
      
      const req = new Request('http://localhost/api/mustahiq/1', { method: 'DELETE' });
      const response = await DELETE(req, { params: { id: '1' } });
      const json = await response.json();
      
      expect(response.status).toBe(500);
      expect(json.error).toBe('Failed to delete data');
    });
  });
});