import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose"; 

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_key");

// Define role-based access control
const protectedRoutes: { [key: string]: string[] } = {
  "/dashboard/kelola-pengguna/:path*": ["superadmin"],
  "/dashboard/kelola-program/:path*": ["superadmin"],
  "/dashboard/kelola-pengaturan/:path*": ["superadmin"],
  "/dashboard/kelola-mustahiq/:path*": ["superadmin", "amil", "relawan"],
  "/dashboard/kelola-penyaluran/:path*": ["superadmin", "amil"],
};

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const requestedPath = req.nextUrl.pathname;

  if (!token) {
    console.warn("No token found, redirecting to '/login'");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const userRole = payload.role as string;

    console.log(`User Role: ${userRole}, Route: ${requestedPath}`);

    for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
      if (requestedPath.startsWith(route) && !allowedRoles.includes(userRole)) {
        console.warn(`Access denied: ${userRole} tried accessing ${requestedPath}`);
        return NextResponse.redirect(new URL("", req.url)); 
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("JWT Verification Failed:", error);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/dashboard/kelola-pengguna/:path*",
    "/dashboard/kelola-program/:path*", 
    "/dashboard/kelola-mustahiq/:path*",
    "/dashboard/kelola-penyaluran/:path*",
    "/dashboard/kelola-pengaturan/:path*",
  ],
};
