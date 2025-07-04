// src/__tests__/api/penyaluran.test.ts
import { GET, POST } from '../../app/api/penyaluran/route';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

// Mock global objects
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

// Mock Prisma and other dependencies
vi.mock('@prisma/client', () => {
    const mockFindMany = vi.fn();
    const mockCreate = vi.fn();
    const mockParameterCreate = vi.fn();
    const mockPrisma = {
      penyaluran: {
        findMany: mockFindMany,
        create: mockCreate,
      },
      parameterFieldValue: {
        create: mockParameterCreate,
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

vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('Penyaluran API Endpoint', () => {
  let prismaInstance: any;
  let originalEnv: NodeJS.ProcessEnv;

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

    // Mock cookies().get() to return a token
    const mockCookies = {
      get: vi.fn(() => ({ value: 'fake-token' })),
    };
    (cookies as vi.Mock).mockReturnValue(mockCookies);
  });

  describe('GET endpoint', () => {
    it('should return all penyaluran data', async () => {
      const mockData = [
        {
          id: 1,
          mustahiq_id: 1,
          program_id: 1,
          tanggal: new Date('2023-01-01'),
          jumlah: 1000000,
          catatan: 'Test catatan',
          status: 'completed',
          created_at: new Date('2023-01-01'),
          mustahiq: { nama: 'John Doe' },
          program: { nama: 'Program 1' },
          creator: { nama: 'Admin' },
          coa_cred: null,
          coa_debt: null,
        },
      ];

      (prismaInstance.penyaluran.findMany as any).mockResolvedValue(mockData);

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual(mockData);
      expect(prismaInstance.penyaluran.findMany).toHaveBeenCalledWith({
        include: {
          mustahiq: true,
          program: true,
          creator: true,
          coa_cred: true,
          coa_debt: true,
        },
        orderBy: { created_at: 'desc' },
      });
    });

    it('should return 500 when an error occurs', async () => {
      (prismaInstance.penyaluran.findMany as any).mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal Server Error');
    });
  });

    describe('POST endpoint', () => {
        it('should create new penyaluran successfully', async () => {
            // Mock token verification
            (jwtVerify as vi.Mock).mockResolvedValue({ payload: { id: 1 } });

            const mockData = {
                mustahiq_id: 1,
                program_id: 1,
                tanggal: '2023-01-01',
                jumlah: 1000000,
                catatan: 'Test catatan',
                status: 'completed',
                parameterValues: [
                    { field_id: 1, value: 'Value 1' },
                    { field_id: 2, value: 'Value 2' },
                ],
            };

            const mockPenyaluran = {
                id: 1,
                ...mockData,
                created_by: 1,
                created_at: new Date(),
            };

            (prismaInstance.penyaluran.create as any).mockResolvedValue(mockPenyaluran);
            (prismaInstance.parameterFieldValue.create as any).mockResolvedValue({});

            const req = new Request('http://localhost/api/penyaluran', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mockData),
            });

            const response = await POST(req);
            const json = await response.json();

            expect(response.status).toBe(201);
            expect(json.message).toBe('Penyaluran created');
            expect(prismaInstance.penyaluran.create).toHaveBeenCalledWith({
                data: {
                    mustahiq_id: mockData.mustahiq_id,
                    program_id: mockData.program_id,
                    tanggal: new Date(mockData.tanggal),
                    jumlah: mockData.jumlah,
                    catatan: mockData.catatan,
                    status: mockData.status,
                    created_by: 1,
                    created_at: expect.any(Date),
                },
            });
        });

        it('should return 401 when unauthorized', async () => {
            // Mock failed token verification
            (jwtVerify as vi.Mock).mockResolvedValue({ payload: null });

            const req = new Request('http://localhost/api/penyaluran', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            const response = await POST(req);
            expect(response.status).toBe(401);
        });

        it('should return 400 when missing required fields', async () => {
            (jwtVerify as vi.Mock).mockResolvedValue({ payload: { id: 1 } });

            const req = new Request('http://localhost/api/penyaluran', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            const response = await POST(req);
            expect(response.status).toBe(400);
        });

        it('should handle parameterValues correctly', async () => {
            (jwtVerify as vi.Mock).mockResolvedValue({ payload: { id: 1 } });

            const mockData = {
                mustahiq_id: 1,
                program_id: 1,
                tanggal: '2023-01-01',
                jumlah: 1000000,
                parameterValues: [
                    { field_id: 1, value: 'Value 1' },
                    { field_id: 2, value: 'Value 2' },
                ],
            };

            const mockPenyaluran = {
                id: 1,
                ...mockData,
                created_by: 1,
                created_at: new Date(),
            };

            (prismaInstance.penyaluran.create as any).mockResolvedValue(mockPenyaluran);
            (prismaInstance.parameterFieldValue.create as any).mockResolvedValue({});

            const req = new Request('http://localhost/api/penyaluran', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mockData),
            });

            const response = await POST(req);
            const json = await response.json();

            expect(response.status).toBe(201);
            expect(json.message).toBe('Penyaluran created');
            expect(prismaInstance.parameterFieldValue.create).toHaveBeenCalledTimes(2);
        });

        it('should return 500 when database error occurs', async () => {
            (jwtVerify as vi.Mock).mockResolvedValue({ payload: { id: 1 } });
            (prismaInstance.penyaluran.create as any).mockRejectedValue(new Error('Database error'));

            const mockData = {
                mustahiq_id: 1,
                program_id: 1,
                tanggal: '2023-01-01',
                jumlah: 1000000,
            };

            const req = new Request('http://localhost/api/penyaluran', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mockData),
            });

            const response = await POST(req);
            expect(response.status).toBe(500);
        });
    });
});