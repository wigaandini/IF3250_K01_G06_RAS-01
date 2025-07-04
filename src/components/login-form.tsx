"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  EyeIcon,
  EyeOffIcon,
  XIcon,
  CheckIcon,
  AlertCircleIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ToastState {
  visible: boolean;
  message: string;
  type: "success" | "error";
}

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api/login";

  const validateEmail = (email: string) => {
    return email.endsWith("@rumahamal.org");
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      setPortalElement(document.body);
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (toast?.visible) {
      timer = setTimeout(() => {
        setToast((prev) => (prev ? { ...prev, visible: false } : null));
      }, 3000); // Toast disappears after 3 seconds
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [toast]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      showToast(
        "Access restricted: Only @rumahamal.org email addresses are allowed",
        "error"
      );
      return;
    }

    if (!password.trim()) {
      showToast("Password cannot be empty", "error");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "same-origin",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error("Authentication failed");
      }

      const { role } = data;
      let redirectPath = "/";
      if (role === "superadmin" || role === "amil" || role === "relawan") {
        redirectPath = "/dashboard";
      }

      showToast("Login successful! Redirecting to dashboard...", "success");

      // Delay redirection until toast is visible
      setTimeout(() => {
        router.push(redirectPath);
      }, 1000); // Redirects after 1 second to allow toast to show
    } catch (err) {
      showToast(
        "Authentication failed. Please check your credentials.",
        "error"
      );
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const ToastPortal = () => {
    if (!toast?.visible || !portalElement) return null;

    return createPortal(
      <div
        className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center pt-4"
        style={{ marginTop: 0 }}
        role="alert"
      >
        <div
          className={`flex items-center p-4 rounded-lg shadow-lg ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          } max-w-xs sm:max-w-md`}
        >
          <div className="inline-flex items-center justify-center flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 mr-2">
            {toast.type === "success" ? (
              <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            ) : (
              <AlertCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            )}
          </div>
          <div className="ml-2 text-xs sm:text-sm font-medium mr-6">
            {toast.message}
          </div>
          <button
            type="button"
            className="absolute right-2 top-2 text-white hover:text-gray-200"
            onClick={() =>
              setToast((prev) => (prev ? { ...prev, visible: false } : null))
            }
            aria-label="Close"
          >
            <XIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>,
      portalElement
    );
  };

  return (
    <>
      <ToastPortal />

      <div className="w-full relative">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-center mb-6 sm:mb-8 text-primary">
          Login
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="email" className="text-sm sm:text-base font-medium">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 sm:h-12 rounded-md border-gray-200"
              required
            />
          </div>

          <div className="space-y-1 sm:space-y-2">
            <Label
              htmlFor="password"
              className="text-sm sm:text-base font-medium"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 sm:h-12 rounded-md border-gray-200 pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-10 sm:h-12 text-sm sm:text-base font-medium bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-xs sm:text-sm">
            Don&apos;t have an account yet? Account creation is managed
            internally.{" "}
            <span className="text-primary font-medium">
              Please contact your team lead.
            </span>
          </p>
        </div>
      </div>
    </>
  );
}
