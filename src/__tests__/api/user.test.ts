import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from '../../app/api/users/route';
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
  const mockFindMany = vi.fn();
  const mockCreate = vi.fn();
  
  return {
    PrismaClient: vi.fn(() => ({
      user: {
        findMany: mockFindMany,
        create: mockCreate
      },
      $disconnect: vi.fn()
    }))
  };
});


vi.mock('bcryptjs', () => {
  return {
    default: {
      hash: vi.fn()
    }
  };
});

describe('Users API Endpoints', () => {
  // Get references to mocked functions
  const mockPrismaClient = new PrismaClient();
  const mockFindMany = mockPrismaClient.user.findMany as unknown as ReturnType<typeof vi.fn>;
  const mockCreate = mockPrismaClient.user.create as unknown as ReturnType<typeof vi.fn>;
  // Create a properly typed mock for bcrypt.hash
  const mockBcryptHash = bcrypt.hash as unknown as ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return all users with 200 status', async () => {
      // Setup mock data
      const mockUsers = [
        { id: 1, nama: 'User 1', email: 'user1@example.com', role: 'admin' },
        { id: 2, nama: 'User 2', email: 'user2@example.com', role: 'user' }
      ];
      
      mockFindMany.mockResolvedValue(mockUsers);
      
      const response = await GET();
      
      expect(mockFindMany).toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(mockUsers, { status: 200 });
      expect((response as any).data).toEqual(mockUsers);
      expect((response as any).status).toBe(200);
    });

    it('should return 500 status when database query fails', async () => {
      // Setup error case
      mockFindMany.mockRejectedValue(new Error('Database connection error'));
      
      const response = await GET();
      
      expect(mockFindMany).toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Internal Server Error' }, 
        { status: 500 }
      );
      expect((response as any).status).toBe(500);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user and return 201 status', async () => {
      const reqBody = {
        nama: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'user',
        alamat: 'Test Address',
        no_telp: '123456789'
      };
      
      const hashedPassword = 'hashed_password_123';
      const expectedNewUser = {
        id: 1,
        ...reqBody,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Use the properly typed mock
      mockBcryptHash.mockResolvedValue(hashedPassword);
      mockCreate.mockResolvedValue(expectedNewUser);
      
      const mockRequest = {
        json: vi.fn().mockResolvedValue(reqBody)
      } as unknown as Request;
      
      const response = await POST(mockRequest);
      
      expect(mockRequest.json).toHaveBeenCalled();
      expect(mockBcryptHash).toHaveBeenCalledWith(reqBody.password, 12);
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          nama: reqBody.nama,
          email: reqBody.email,
          password: hashedPassword,
          role: reqBody.role,
          alamat: reqBody.alamat,
          no_telp: reqBody.no_telp
        }
      });
      expect(NextResponse.json).toHaveBeenCalledWith(expectedNewUser, { status: 201 });
      expect((response as any).data).toEqual(expectedNewUser);
      expect((response as any).status).toBe(201);
    });

    it('should return 400 status when required fields are missing', async () => {
      // Setup incomplete data
      const incompleteBody = {
        nama: 'Incomplete User',
        email: 'incomplete@example.com',
        // Missing password and role
      };
      
      // Create mock request
      const mockRequest = {
        json: vi.fn().mockResolvedValue(incompleteBody)
      } as unknown as Request;
      
      const response = await POST(mockRequest);
      
      expect(mockRequest.json).toHaveBeenCalled();
      expect(mockBcryptHash).not.toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Semua field wajib diisi!' }, 
        { status: 400 }
      );
      expect((response as any).status).toBe(400);
    });

    it('should return 500 status when user creation fails', async () => {
      // Setup valid data
      const reqBody = {
        nama: 'Error User',
        email: 'error@example.com',
        password: 'password123',
        role: 'user',
        alamat: 'Test Address',
        no_telp: '123456789'
      };
      
      // Setup error case
      mockBcryptHash.mockResolvedValue('hashed_password');
      mockCreate.mockRejectedValue(new Error('Database error'));
      
      // Create mock request
      const mockRequest = {
        json: vi.fn().mockResolvedValue(reqBody)
      } as unknown as Request;
      
      // Execute
      const response = await POST(mockRequest);
      
      // Assert
      expect(mockRequest.json).toHaveBeenCalled();
      expect(mockBcryptHash).toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Internal Server Error' }, 
        { status: 500 }
      );
      expect((response as any).status).toBe(500);
    });
    
    it('should handle JSON parsing errors', async () => {
      // Setup error in request parsing
      const mockRequest = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      } as unknown as Request;
      
      const response = await POST(mockRequest);
      
      expect(mockRequest.json).toHaveBeenCalled();
      expect(mockBcryptHash).not.toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Internal Server Error' }, 
        { status: 500 }
      );
      expect((response as any).status).toBe(500);
    });
  });
});