'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, ArrowRight, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const { user } = useAuth();

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (user) {
    router.push('/');
    return null;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim().toLowerCase(),
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else if (data.user) {
        // Check if email confirmation is required
        if (data.session) {
          router.push('/');
        } else {
          setSuccessMsg(
            'Registration successful! Please check your email to confirm your account or sign in directly.'
          );
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12">
      <div className="card-riso p-6 md:p-8 relative">
        <h1 className="font-['Archivo_Black',sans-serif] text-2xl text-[#1A1A1A] uppercase tracking-tight">
          Create Account
        </h1>
        <p className="font-mono text-xs text-[#61609A] mt-1">
          Join sellers, makers, and circular architects.
        </p>

        {errorMsg && (
          <div className="mt-4 p-3 bg-[#C94245] border-2 border-[#1A1A1A] text-[#F9F5F2] font-mono text-xs rounded-[6px] shadow-[2px_2px_0px_#1A1A1A]">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-[#B5C995] border-2 border-[#1A1A1A] text-[#1A1A1A] font-mono text-xs rounded-[6px] shadow-[2px_2px_0px_#1A1A1A] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          <div>
            <label className="block font-mono text-xs font-bold text-[#1A1A1A] uppercase mb-1">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. woodcraft_salvage"
              className="input-riso"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-bold text-[#1A1A1A] uppercase mb-1">
              Full Name (Optional)
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              className="input-riso"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-bold text-[#1A1A1A] uppercase mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@reclaimed.org"
              className="input-riso"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-bold text-[#1A1A1A] uppercase mb-1">
              Password (6+ characters)
            </label>
            <input
              type="password"
              required
              minLength={6}
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
              <span>Creating Account...</span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Join ReUseHub</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t-2 border-[#1A1A1A]/20 text-center font-mono text-xs">
          <p className="text-[#61609A]">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-[#1A1A1A] font-bold underline hover:text-[#C94245]"
            >
              Sign In <ArrowRight className="inline w-3 h-3" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
