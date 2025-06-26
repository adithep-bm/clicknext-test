'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const [email, setEmail] = useState("test@example.com"); 
  const [password, setPassword] = useState("1234"); 
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard");
    } 
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.errors?.[0]?.message);
      return;
    }

    try {
      const response = await axios.post("http://localhost:3001/api/login", {
        email,
        password,
      });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userId", response.data.userId);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid email or password");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white px-4">
      <div className="w-full max-w-sm">
        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="email">
              Email *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="password">
              Password *
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gray-800 text-white py-2.5 rounded-md hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-opacity-50"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}