'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Check your email for the password recovery link.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12">
      <div className="card-riso p-6 md:p-8">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#61609A] hover:text-[#1A1A1A] mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>

        <h1 className="font-['Archivo_Black',sans-serif] text-2xl text-[#1A1A1A] uppercase tracking-tight">
          Reset Password
        </h1>
        <p className="font-mono text-xs text-[#61609A] mt-1">
          Enter your email and we&apos;ll send recovery instructions.
        </p>

        {errorMsg && (
          <div className="mt-4 p-3 bg-[#C94245] border-2 border-[#1A1A1A] text-[#F9F5F2] font-mono text-xs rounded-[6px]">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-[#B5C995] border-2 border-[#1A1A1A] text-[#1A1A1A] font-mono text-xs rounded-[6px] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleReset} className="mt-6 space-y-4">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-pill btn-pill-yellow mt-4 flex items-center justify-center gap-2 text-sm font-bold"
          >
            {loading ? (
              <span>Sending...</span>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                <span>Send Reset Link</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
