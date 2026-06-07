"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Fingerprint, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const FEATURES = [
  "Saudi QR Reader Compatible",
  "Tax Invoices",
  "Customer Management",
  "Real-time Data",
  "Print & Export",
  "VAT 15% Auto Calc",
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!username || !password) {
      setError("Please enter your username and password.");
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: username,
      password,
    });
    setLoading(false);
    if (authError) {
      setError("Invalid username or password.");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-hidden font-sans">

      {/* ── LEFT PANEL: Dark Branding ─────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] min-h-screen bg-[#0f1117] px-14 py-12 relative overflow-hidden">

        {/* Ambient glow blobs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-indigo-700/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-emerald-700/8 blur-3xl pointer-events-none" />

        {/* Brand mark */}
<div className=" flex-col items-center gap-3 relative z-10">
  {/* Logo */}
  <img
    src="/logoooo.png" // replace with your logo path
    alt="Nexora Logo"
    className="h-19 w-auto"
  />
  <br />

  {/* Invoice Label */}
  <div className="flex items-center gap-2.5">
    <span className="w-2 h-2 rounded-full bg-indigo-500 block" />
    <span className="text-[13px] font-medium tracking-[0.16em] text-white/60 uppercase">
      Nexora Invoices
    </span>
  </div>
</div>

        {/* Hero text */}
        <div className="relative z-10">
          <h2 className="font-serif text-[42px] font-light text-white leading-[1.15] tracking-tight mb-4">
            Smart invoicing<br />
            for{" "}
            <em className="italic text-indigo-300 not-italic" style={{ fontStyle: "italic" }}>
              modern
            </em>
            <br />
            business.
          </h2>
          <p className="text-[13px] font-light text-white/65 leading-relaxed max-w-[280px]">
            Manage tax invoices, clients, and VAT compliance — all in one place.
          </p>
        </div>

        {/* Feature list */}
        <div className="relative z-10 flex flex-col gap-3">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2.5">
              <span className="w-[3px] h-[3px] rounded-full bg-indigo-500 flex-shrink-0" />
              <span className="text-[12px] text-white/80 tracking-wide">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── DIVIDER ───────────────────────────────────────────── */}
      <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent" />

      {/* ── RIGHT PANEL: Login Form ───────────────────────────── */}
      <div className="flex flex-col justify-center items-center flex-1 min-h-screen bg-white px-8 sm:px-14 py-12">

        <div className="w-full max-w-[360px]">

          {/* Logo */}
          <div className="mb-6 flex justify-center w-full">
            <Image
              src="/logo.jpg"
              alt="WASHIKA TABASSUM MARWAH Co. Logo"
              width={72}
              height={72}
              priority
              className="object-contain rounded-xl"
            />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p className="text-[11px] font-medium tracking-[0.15em] text-gray-400 uppercase mb-2">
              WASHIKA TABASSUM MARWAH Co.
            </p>
            <h1 className="font-serif text-[30px] font-medium text-gray-900 leading-snug">
              Welcome back
            </h1>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-2.5">
              {error}
            </div>
          )}

          {/* Username */}
          <div className="mb-4">
            <label className="block text-[11px] font-medium tracking-[0.1em] text-gray-400 uppercase mb-2">
              Username
            </label>
            <input
              type="text"
              placeholder="your@email.com"
              value={username}
              autoComplete="username"
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full h-11 border border-gray-200 rounded-md px-3.5 text-sm text-gray-800 bg-gray-50 placeholder-gray-300 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-[11px] font-medium tracking-[0.1em] text-gray-400 uppercase mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full h-11 border border-gray-200 rounded-md px-3.5 pr-11 text-sm text-gray-800 bg-gray-50 placeholder-gray-300 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-md bg-[#0f1117] text-white text-[13px] font-medium tracking-wide transition-all hover:opacity-85 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mb-5"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Fingerprint size={16} />
            )}
            {loading ? "Signing in…" : "Sign in"}
            {!loading && <span className="ml-0.5">→</span>}
          </button>

          {/* Separator */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[11px] text-gray-600 tracking-wide">secure access</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Footer */}
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full px-3 py-1 text-[11px] text-gray-600 tracking-wide mb-4">
              <span className="w-[5px] h-[5px] rounded-full bg-emerald-500 block" />
              Version 1.0
            </div>
            <p className="text-xs text-gray-400">
              Engineered & Developed by{" "}
              <a
                href="https://www.nexoratech.info/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:underline font-medium"
              >
                Nexora Tech
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}