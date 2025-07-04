global.File = class File {
  name: string;
  type: string;
  data: any;

  constructor(bits: any[], name: string, options: {type: string}) {
    this.name = name;
    this.type = options.type;
    this.data = bits;
  }
};

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '../../app/api/mustahiq/route';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { writeFile } from 'fs/promises';

vi.mock('jose', () => ({ jwtVerify: vi.fn() }));
vi.mock('next/headers', () => ({
cookies: vi.fn(() => ({ get: vi.fn() }))
}));
vi.mock('@prisma/client', () => {
const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();
const mockCreate = vi.fn();
return {
  PrismaClient: vi.fn(() => ({
    mustahiq: {
      findMany: mockFindMany,
      create: mockCreate
    },
    asnaf: {
      findFirst: mockFindFirst,
      findMany: vi.fn()
    }
  }))
};
});
vi.mock('fs/promises', () => ({
writeFile: vi.fn()
}));

vi.mock('@supabase/supabase-js', () => {
return {
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'mock-url' } })
      }))
    }
  }))
};
});

const mockTokenPayload = {
payload: { id: 1, email: 'admin@example.com' }
};

beforeEach(() => {
vi.clearAllMocks();
(jwtVerify as vi.Mock).mockResolvedValue(mockTokenPayload);
(cookies as vi.Mock).mockReturnValue({ get: vi.fn(() => ({ value: 'token' })) });
process.env.SUPABASE_URL = 'http://mock-supabase-url.com';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';
});

describe('Mustahiq Route Handlers', () => {
it('GET - should return 401 if unauthorized', async () => {
  (jwtVerify as vi.Mock).mockRejectedValueOnce(new Error('Invalid token'));

  const response = await GET();
  const json = await response.json();

  expect(response.status).toBe(401);
  expect(json.error).toBe('Unauthorized');
});

it('GET - should return mustahiq records', async () => {
  const records = [{ id: 1, nama: 'Test' }];
  const prisma = new PrismaClient();
  (prisma.mustahiq.findMany as any).mockResolvedValue(records);

  const response = await GET();
  const json = await response.json();

  expect(response.status).toBe(200);
  expect(json).toEqual(records);
});

it('GET - should return 500 on DB error', async () => {
  const prisma = new PrismaClient();
  (prisma.mustahiq.findMany as any).mockRejectedValue(new Error('DB error'));

  const response = await GET();
  const json = await response.json();

  expect(response.status).toBe(500);
  expect(json.error).toBe('Gagal mengambil data mustahiq');
});

it('POST - should return 201 with valid data and files', async () => {
  const prisma = new PrismaClient();
  const mockFile = new File(['dummy'], 'file.jpg', { type: 'image/jpeg' });
  const mockFormData = new FormData();
  mockFormData.append('NIK', '123');
  mockFormData.append('nama', 'John');
  mockFormData.append('jenis_kelamin', 'Laki-laki');
  mockFormData.append('tempat_lahir', 'Jakarta');
  mockFormData.append('tanggal_lahir', '2000-01-01');
  mockFormData.append('no_telepon', '08123');
  mockFormData.append('email', 'a@a.com');
  mockFormData.append('alamat', 'Jl. Test');
  mockFormData.append('kode_pos', '12345');
  mockFormData.append('status_pernikahan', 'Lajang');
  mockFormData.append('pekerjaan', 'Programmer');
  mockFormData.append('agama', 'Islam');
  mockFormData.append('pendidikan_terakhir', 'S1');
  mockFormData.append('asnaf', JSON.stringify([1]));

  vi.spyOn(Request.prototype, 'formData').mockResolvedValue(mockFormData);
  (prisma.asnaf.findFirst as any).mockResolvedValue({ id: 99 });
  (prisma.mustahiq.create as any).mockResolvedValue({ id: 1 });

  const req = new Request('http://localhost/api/mustahiq', { method: 'POST' });
  const response = await POST(req);
  const json = await response.json();

  expect(response.status).toBe(201);
  expect(json.success).toBe(true);
  expect(json.data.id).toBe(1);
});

it('POST - should return 400 if no asnaf and no fallback', async () => {
  const prisma = new PrismaClient();
  const mockFormData = new FormData();
  mockFormData.append('asnaf', '');
  vi.spyOn(Request.prototype, 'formData').mockResolvedValue(mockFormData);
  (prisma.asnaf.findFirst as any).mockResolvedValue(null);

  const req = new Request('http://localhost/api/mustahiq', { method: 'POST' });
  const response = await POST(req);
  const json = await response.json();

  expect(response.status).toBe(400);
  expect(json.error).toBe('Data asnaf tidak valid. Silakan pilih minimal satu kategori asnaf.');
});

it('POST - should return 500 on creation failure', async () => {
  const prisma = new PrismaClient();
  const mockFormData = new FormData();
  mockFormData.append('asnaf', '[1]');
  vi.spyOn(Request.prototype, 'formData').mockResolvedValue(mockFormData);
  (prisma.mustahiq.create as any).mockRejectedValue(new Error('DB error'));

  const req = new Request('http://localhost/api/mustahiq', { method: 'POST' });
  const response = await POST(req);
  const json = await response.json();

  expect(response.status).toBe(500);
  expect(json.error).toBe('Gagal membuat mustahiq');
});
});
