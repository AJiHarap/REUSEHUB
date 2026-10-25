'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, ArrowRight, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const { user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (user) {
    router.push('/');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else if (data.session) {
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12">
      <div className="card-riso p-6 md:p-8 relative">
        <div className="absolute -top-4 -right-3 bg-[#F4ED36] border-2 border-[#1A1A1A] px-3 py-1 rounded-full shadow-[2px_2px_0px_#1A1A1A] rotate-3 flex items-center gap-1 font-mono text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-[#1A1A1A]" />
          <span>Members</span>
        </div>

        <h1 className="font-['Archivo_Black',sans-serif] text-2xl text-[#1A1A1A] uppercase tracking-tight">
          Sign In
        </h1>
        <p className="font-mono text-xs text-[#61609A] mt-1">
          Welcome back to the circular materials market.
        </p>

        {errorMsg && (
          <div className="mt-4 p-3 bg-[#C94245] border-2 border-[#1A1A1A] text-[#F9F5F2] font-mono text-xs rounded-[6px] shadow-[2px_2px_0px_#1A1A1A]">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block font-mono text-xs font-bold text-[#1A1A1A] uppercase mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-riso"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-mono text-xs font-bold text-[#1A1A1A] uppercase">
                Password
              </label>
              <Link
                href="/auth/reset-password"
                className="font-mono text-[11px] text-[#61609A] hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-riso"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-pill btn-pill-yellow mt-4 flex items-center justify-center gap-2 text-sm font-bold"
          >
            {loading ? (
              <span>Signing In...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Enter ReUseHub</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t-2 border-[#1A1A1A]/20 text-center font-mono text-xs">
          <p className="text-[#61609A]">
            Don&apos;t have an account yet?{' '}
            <Link
              href="/auth/register"
              className="text-[#1A1A1A] font-bold underline hover:text-[#C94245]"
            >
              Sign Up <ArrowRight className="inline w-3 h-3" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
