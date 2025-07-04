import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../../app/api/auth/role/route'; 
import { NextResponse } from 'next/server';
import * as jose from 'jose';
import * as nextHeaders from 'next/headers';

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, options) => ({ 
      data, 
      options,
      status: options?.status || 200
    }))
  }
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn()
}));

vi.mock('jose', () => ({
  jwtVerify: vi.fn()
}));

describe('Authentication Endpoint', () => {
  // Define mock types
  const mockCookieStore = {
    get: vi.fn()
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup the cookie store mock
    (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockCookieStore);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return 401 when no token is provided', async () => {
    // Setup: No token in cookies
    mockCookieStore.get.mockReturnValue(undefined);
    
    const response = await GET();
    
    expect(mockCookieStore.get).toHaveBeenCalledWith('token');
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Unauthorized' }, 
      { status: 401 }
    );
    expect((response as any).status).toBe(401);
  });

  it('should return 403 when token is invalid', async () => {
    // Setup: Token exists but verification fails
    mockCookieStore.get.mockReturnValue({ value: 'invalid-token' });
    (jose.jwtVerify as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('Invalid token');
    });
    
    const response = await GET();
    
    expect(mockCookieStore.get).toHaveBeenCalledWith('token');
    expect(jose.jwtVerify).toHaveBeenCalled();
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Invalid token' }, 
      { status: 403 }
    );
    expect((response as any).status).toBe(403);
  });

  it('should return user data when token is valid', async () => {
    const mockPayload = { id: 'user123', role: 'admin' };
    mockCookieStore.get.mockReturnValue({ value: 'valid-token' });
    (jose.jwtVerify as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      return Promise.resolve({ payload: mockPayload });
    });
    
    // Execute
    const response = await GET();
    
    // Assert
    expect(mockCookieStore.get).toHaveBeenCalledWith('token');
    expect(jose.jwtVerify).toHaveBeenCalled();
    expect(NextResponse.json).toHaveBeenCalledWith({
      id: mockPayload.id,
      role: mockPayload.role
    });
    expect((response as any).data).toEqual({
      id: mockPayload.id,
      role: mockPayload.role
    });
  });
  
  it('should use correct SECRET_KEY for verification', async () => {
    // Setup
    const originalEnv = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'test_secret_key';
    mockCookieStore.get.mockReturnValue({ value: 'valid-token' });
    (jose.jwtVerify as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      return Promise.resolve({ 
        payload: { id: 'user123', role: 'user' } 
      });
    });
    
    await GET();
    

    expect(jose.jwtVerify).toHaveBeenCalled();

    process.env.JWT_SECRET = originalEnv;
  });

  it('should use fallback secret when JWT_SECRET env is not set', async () => {
    // Setup
    const originalEnv = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    mockCookieStore.get.mockReturnValue({ value: 'valid-token' });
    (jose.jwtVerify as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      return Promise.resolve({ 
        payload: { id: 'user123', role: 'user' } 
      });
    });
    
    await GET();
    
    expect(jose.jwtVerify).toHaveBeenCalled();
    process.env.JWT_SECRET = originalEnv;
  });
});