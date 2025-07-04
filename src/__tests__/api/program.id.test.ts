import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, PUT, DELETE } from '../../app/api/program/[id]/route';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

// Mock PrismaClient
vi.mock('@prisma/client', () => {
  const mockFindUnique = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockDeleteMany = vi.fn();
  const mockCreate = vi.fn();
  const mockCreateMany = vi.fn();
  
  return {
    PrismaClient: vi.fn(() => ({
      program_Bantuan: {
        findUnique: mockFindUnique,
        update: mockUpdate,
        delete: mockDelete,
      },
      parameterField: {
        deleteMany: mockDeleteMany,
        create: mockCreate,
      },
      parameterFieldValue: {
        deleteMany: mockDeleteMany,
      },
      programSumberDana: {
        deleteMany: mockDeleteMany,
        createMany: mockCreateMany,
      },
      $disconnect: vi.fn(),
    })),
    Prisma: {
      DbNull: Symbol.for('Prisma.DbNull'),
    }
  };
});

describe('Program [id] Route Handlers', () => {
  let prisma: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    prisma = new PrismaClient();
  });

  // GET Tests
  describe('GET', () => {
    it('should return 400 for invalid ID format', async () => {
      const response = await GET({} as Request, { params: { id: 'invalid' } });
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Invalid ID format');
    });

    it('should return 404 when program not found', async () => {
      prisma.program_Bantuan.findUnique.mockResolvedValue(null);
      const response = await GET({} as Request, { params: { id: '1' } });
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toBe('Program not found');
    });

    it('should return program data when found', async () => {
      const mockProgram = { id: 1, nama_program: 'Test Program' };
      prisma.program_Bantuan.findUnique.mockResolvedValue(mockProgram);
      const response = await GET({} as Request, { params: { id: '1' } });
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual(mockProgram);
    });

    it('should return 500 on database error', async () => {
      prisma.program_Bantuan.findUnique.mockRejectedValue(new Error('DB error'));
      const response = await GET({} as Request, { params: { id: '1' } });
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Internal Server Error');
    });
  });

  // PUT Tests
  describe('PUT', () => {
    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        nama_program: 'Updated Program',
        parameterFields: []
      })
    } as unknown as Request;

    it('should update program successfully', async () => {
      const mockUpdatedProgram = { id: 1, nama_program: 'Updated Program' };
      prisma.program_Bantuan.update.mockResolvedValue(mockUpdatedProgram);
      
      const response = await PUT(mockRequest, { params: { id: '1' } });
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.message).toBe('Program updated successfully');
      expect(json.program).toEqual(mockUpdatedProgram);
    });

    it('should handle parameter fields update', async () => {
      const mockUpdatedProgram = { id: 1, nama_program: 'Updated Program' };
      const mockParameterFields = [
        { field_name: 'test', field_type: 'text' }
      ];
      
      mockRequest.json = vi.fn().mockResolvedValue({
        nama_program: 'Updated Program',
        parameterFields: mockParameterFields
      });
      
      prisma.program_Bantuan.update.mockResolvedValue(mockUpdatedProgram);
      
      const response = await PUT(mockRequest, { params: { id: '1' } });
      expect(response.status).toBe(200);
      expect(prisma.parameterField.deleteMany).toHaveBeenCalled();
      expect(prisma.parameterField.create).toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      prisma.program_Bantuan.update.mockRejectedValue(new Error('DB error'));
      const response = await PUT(mockRequest, { params: { id: '1' } });
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Internal Server Error');
    });
  });

  // DELETE Tests
  describe('DELETE', () => {
    it('should return 404 when program not found', async () => {
      // Mock findUnique to return null for program not found
      prisma.program_Bantuan.findUnique.mockResolvedValue(null);
      
      const response = await DELETE(
        {} as Request, 
        { 
          params: { id: '999' }
        }
      );
      
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toBe('Program not found');
    });

    it('should delete program successfully', async () => {
      // Mock findUnique to return a program (exists)
      const mockProgram = { id: 1, nama_program: 'Test Program' };
      prisma.program_Bantuan.findUnique.mockResolvedValue(mockProgram);
      
      // Mock all delete operations to succeed
      prisma.parameterFieldValue.deleteMany.mockResolvedValue({ count: 0 });
      prisma.parameterField.deleteMany.mockResolvedValue({ count: 0 });
      prisma.programSumberDana.deleteMany.mockResolvedValue({ count: 0 });
      prisma.program_Bantuan.delete.mockResolvedValue(mockProgram);
      
      const response = await DELETE(
        {} as Request, 
        { 
          params: { id: '1' }
        }
      );
      
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.message).toBe('Program deleted successfully');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await DELETE(
        {} as Request, 
        { 
          params: { id: 'invalid' }
        }
      );
      
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Invalid ID format');
    });

    it('should return 500 on database error', async () => {
      // Mock findUnique to return a program (so it passes the existence check)
      const mockProgram = { id: 1, nama_program: 'Test Program' };
      prisma.program_Bantuan.findUnique.mockResolvedValue(mockProgram);
      
      // Mock the first delete operation to fail
      prisma.parameterFieldValue.deleteMany.mockRejectedValue(new Error('DB error'));
      
      const response = await DELETE(
        {} as Request, 
        { 
          params: { id: '1' }
        }
      );
      
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Internal Server Error');
    });
  });
});