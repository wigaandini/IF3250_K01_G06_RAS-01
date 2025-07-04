import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, PUT, DELETE } from '../../app/api/users/[id]/route';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Mock dependencies
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, options) => ({ 
      data, 
      options,
      status: options?.status || 200
    }))
  }
}));

vi.mock('@prisma/client', () => {
  const mockFindUnique = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  
  return {
    PrismaClient: vi.fn(() => ({
      user: {
        findUnique: mockFindUnique,
        update: mockUpdate,
        delete: mockDelete
      },
      $disconnect: vi.fn()
    }))
  };
});

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn()
  }
}));

describe('User ID API Endpoints', () => {
  // Get references to mocked functions
  const mockPrismaClient = new PrismaClient();
  const mockFindUnique = mockPrismaClient.user.findUnique as unknown as ReturnType<typeof vi.fn>;
  const mockUpdate = mockPrismaClient.user.update as unknown as ReturnType<typeof vi.fn>;
  const mockDelete = mockPrismaClient.user.delete as unknown as ReturnType<typeof vi.fn>;
  const mockBcryptHash = bcrypt.hash as unknown as ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/users/[id]', () => {
    it('should return user with matching ID and 200 status', async () => {
      // Setup mock data
      const mockUser = {
        id: 1,
        nama: 'User 1',
        email: 'user1@example.com',
        password: 'hashed_password',
        role: 'admin',
        alamat: 'Test Address',
        no_telp: '123456789',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockFindUnique.mockResolvedValue(mockUser);
      
      const req = {} as Request;
      const params = { id: '1' };
      
      const response = await GET(req, { params });
      
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(NextResponse.json).toHaveBeenCalledWith(mockUser, { status: 200 });
      expect((response as any).data).toEqual(mockUser);
      expect((response as any).status).toBe(200);
    });

    it('should return 404 status when user is not found', async () => {
      mockFindUnique.mockResolvedValue(null);
      
      const req = {} as Request;
      const params = { id: '999' };
      
      const response = await GET(req, { params });
      
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 999 }
      });
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "User tidak ditemukan" }, 
        { status: 404 }
      );
      expect((response as any).status).toBe(404);
    });

    it('should return 500 status when database query fails', async () => {
      mockFindUnique.mockRejectedValue(new Error('Database error'));
      
      const req = {} as Request;
      const params = { id: '1' };
      
      const response = await GET(req, { params });
      
      expect(mockFindUnique).toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Internal Server Error" }, 
        { status: 500 }
      );
      expect((response as any).status).toBe(500);
    });
  });

  describe('PUT /api/users/[id]', () => {
    it('should update user and return 200 status', async () => {
      // Setup mock data
      const existingUser = {
        id: 1,
        nama: 'Old Name',
        email: 'old@example.com',
        password: 'old_hashed_password',
        role: 'user',
        alamat: 'Old Address',
        no_telp: '111111111',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedFields = {
        nama: 'New Name',
        email: 'new@example.com',
        role: 'admin',
        alamat: 'New Address',
        no_telp: '222222222'
      };

      const updatedUser = {
        ...existingUser,
        ...updatedFields
      };
      
      mockFindUnique.mockResolvedValue(existingUser);
      mockUpdate.mockResolvedValue(updatedUser);
      
      // Mock request with URL and JSON body
      const req = {
        url: 'http://localhost:3000/api/users/1',
        json: vi.fn().mockResolvedValue(updatedFields)
      } as unknown as Request;
      
      const response = await PUT(req);
      
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(req.json).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          nama: updatedFields.nama,
          email: updatedFields.email,
          password: existingUser.password,
          role: updatedFields.role,
          alamat: updatedFields.alamat,
          no_telp: updatedFields.no_telp
        }
      });
      expect(NextResponse.json).toHaveBeenCalledWith({
        message: "User berhasil diperbarui",
        user: updatedUser
      });
    });

    it('should hash password when updating password', async () => {
      // Setup mock data
      const existingUser = {
        id: 1,
        nama: 'Test User',
        email: 'test@example.com',
        password: 'old_hashed_password',
        role: 'user',
        alamat: 'Test Address',
        no_telp: '123456789',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updateData = {
        nama: 'Updated Name',
        password: 'new_password'
      };

      const hashedPassword = 'new_hashed_password';
      const updatedUser = {
        ...existingUser,
        nama: updateData.nama,
        password: hashedPassword
      };
      
      mockFindUnique.mockResolvedValue(existingUser);
      mockBcryptHash.mockResolvedValue(hashedPassword);
      mockUpdate.mockResolvedValue(updatedUser);
      
      // Mock request with URL and JSON body
      const req = {
        url: 'http://localhost:3000/api/users/1',
        json: vi.fn().mockResolvedValue(updateData)
      } as unknown as Request;
      
      const response = await PUT(req);
      
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(mockBcryptHash).toHaveBeenCalledWith(updateData.password, 12);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          nama: updateData.nama,
          email: existingUser.email,
          password: hashedPassword,
          role: existingUser.role,
          alamat: existingUser.alamat,
          no_telp: existingUser.no_telp
        }
      });
    });

    it('should return 404 status when user is not found', async () => {
      mockFindUnique.mockResolvedValue(null);
      
      const req = {
        url: 'http://localhost:3000/api/users/999',
        json: vi.fn().mockResolvedValue({ nama: 'New Name' })
      } as unknown as Request;
      
      const response = await PUT(req);
      
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 999 }
      });
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "User tidak ditemukan" }, 
        { status: 404 }
      );
      expect((response as any).status).toBe(404);
    });

    it('should return 400 status when ID is invalid', async () => {
      const req = {
        url: 'http://localhost:3000/api/users/invalid',
        json: vi.fn()
      } as unknown as Request;
      
      const response = await PUT(req);
      
      expect(req.json).not.toHaveBeenCalled();
      expect(mockFindUnique).not.toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Invalid user ID" }, 
        { status: 400 }
      );
      expect((response as any).status).toBe(400);
    });

    it('should return 500 status when update fails', async () => {
      // Setup mocks
      const existingUser = {
        id: 1,
        nama: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'user',
        alamat: 'Test Address',
        no_telp: '123456789',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockFindUnique.mockResolvedValue(existingUser);
      mockUpdate.mockRejectedValue(new Error('Database error'));
      
      const req = {
        url: 'http://localhost:3000/api/users/1',
        json: vi.fn().mockResolvedValue({ nama: 'New Name' })
      } as unknown as Request;
      
      const response = await PUT(req);
      
      expect(mockFindUnique).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Internal Server Error" }, 
        { status: 500 }
      );
      expect((response as any).status).toBe(500);
    });
  });

  describe('DELETE /api/users/[id]', () => {
    it('should delete user and return 200 status', async () => {
      // Setup mock data
      const existingUser = {
        id: 1,
        nama: 'User to Delete',
        email: 'delete@example.com',
        password: 'hashed_password',
        role: 'user',
        alamat: 'Test Address',
        no_telp: '123456789',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockFindUnique.mockResolvedValue(existingUser);
      mockDelete.mockResolvedValue(existingUser);
      
      const req = {} as Request;
      const params = { id: '1' };
      
      const response = await DELETE(req, { params });
      
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(mockDelete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(NextResponse.json).toHaveBeenCalledWith(
        { message: "User berhasil dihapus" }, 
        { status: 200 }
      );
      expect((response as any).status).toBe(200);
    });

    it('should return 404 status when user is not found', async () => {
      mockFindUnique.mockResolvedValue(null);
      
      const req = {} as Request;
      const params = { id: '999' };
      
      const response = await DELETE(req, { params });
      
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 999 }
      });
      expect(mockDelete).not.toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "User tidak ditemukan" }, 
        { status: 404 }
      );
      expect((response as any).status).toBe(404);
    });

    it('should return 500 status when delete fails', async () => {
      // Setup mock error
      const existingUser = {
        id: 1,
        nama: 'User to Delete',
        email: 'delete@example.com',
        password: 'hashed_password',
        role: 'user',
        alamat: 'Test Address',
        no_telp: '123456789'
      };
      
      mockFindUnique.mockResolvedValue(existingUser);
      mockDelete.mockRejectedValue(new Error('Database error'));
      
      const req = {} as Request;
      const params = { id: '1' };
      
      const response = await DELETE(req, { params });
      
      expect(mockFindUnique).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Internal Server Error" }, 
        { status: 500 }
      );
      expect((response as any).status).toBe(500);
    });
  });
});