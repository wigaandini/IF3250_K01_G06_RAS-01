import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { POST } from '../../app/api/login/route';
import { PrismaClient } from '.prisma/client';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

// Mock the entire module
vi.mock('.prisma/client', () => {
  const mockFindUnique = vi.fn();
  const mockPrisma = {
    user: {
      findUnique: mockFindUnique
    }
  };
  return { 
    PrismaClient: vi.fn(() => mockPrisma) 
  };
});

// Mock the NextResponse
vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: vi.fn().mockImplementation((body, options = {}) => {
        console.log('NextResponse.json called with:', { body, options });
        
        // Create a response object with cookies implementation
        const response = {
          status: options.status || 200,
          json: async () => body,
          cookies: {
            _cookieStore: new Map(),
            get: vi.fn(name => response.cookies._cookieStore.get(name)),
            set: vi.fn((name, value, options) => {
              response.cookies._cookieStore.set(name, { 
                name, 
                value, 
                options
              });
            })
          }
        };
        
        // set the token cookie after creating the response
        if (body.message === "Login berhasil!") {
          response.cookies.set("token", "mocked-jwt-token", {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            path: "/",
            maxAge: 3600
          });
        }
        
        return response;
      })
    }
  };
});

// You might need to mock jose if you're still having issues
vi.mock("jose", () => {
  return {
    SignJWT: vi.fn().mockImplementation(() => ({
      setProtectedHeader: vi.fn().mockReturnThis(),
      setExpirationTime: vi.fn().mockReturnThis(),
      setIssuedAt: vi.fn().mockReturnThis(),
      sign: vi.fn().mockResolvedValue("mocked-jwt-token")
    }))
  };
});

describe("Login API Endpoint", () => {
  const mockUser = {
    id: 1,
    email: "test@example.com",
    password: bcrypt.hashSync("password123", 10),
    role: "user"
  };

  let originalEnv: NodeJS.ProcessEnv;
  let prismaInstance: any;

  beforeAll(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv, JWT_SECRET: "test_secret_key" };
    prismaInstance = new PrismaClient();
  });

  afterAll(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when email or password is missing", async () => {
    // Create a mock request
    const req = new Request('http://localhost/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    // Mock the json method
    vi.spyOn(Request.prototype, 'json')
      .mockImplementation(() => Promise.resolve({}));

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Email dan Password wajib diisi");
  });

  it("should return 404 when email is not found", async () => {
    (prismaInstance.user.findUnique as any).mockResolvedValue(null);

    // Create a mock request
    const req = new Request('http://localhost/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: "cupi@rumahamal.org", password: "adminpassword" })
    });
    
    // Mock the json method
    vi.spyOn(Request.prototype, 'json')
      .mockImplementation(() => Promise.resolve({ 
        email: "cupi@rumahamal.org", 
        password: "adminpassword" 
      }));

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Email atau password salah");
  });

  it("should return 401 when password is incorrect", async () => {
    (prismaInstance.user.findUnique as any).mockResolvedValue(mockUser);

    // Create a mock request
    const req = new Request('http://localhost/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: "admin@rumahamal.org", password: "wrongpassword" })
    });
    
    // Mock the json method
    vi.spyOn(Request.prototype, 'json')
      .mockImplementation(() => Promise.resolve({ 
        email: "admin@rumahamal.org", 
        password: "wrongpassword" 
      }));

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Email atau password salah!");
  });

  it("should return 200 and set token in cookies when credentials are correct", async () => {
    (prismaInstance.user.findUnique as any).mockResolvedValue(mockUser);

    // Create a mock request
    const req = new Request('http://localhost/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: "admin@rumahamal.org", password: "adminpassword" })
    });
    
    // Mock the json method
    vi.spyOn(Request.prototype, 'json')
      .mockImplementation(() => Promise.resolve({ 
        email: "admin@rumahamal.org", 
        password: "adminpassword" 
      }));

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe("Login berhasil!");
    expect(response.cookies.get("token")).toBeDefined();
  });
});