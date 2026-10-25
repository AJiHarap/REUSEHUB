'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Save, Loader2, User as UserIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const [supabase] = useState(() => createClient());

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setFullName(profile.full_name || '');
      setBio(profile.bio || '');
      setLocation(profile.location || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;

    setUploadingAvatar(true);
    setErrorMsg('');
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        setErrorMsg('Avatar upload failed: ' + uploadError.message);
      } else {
        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        if (data?.publicUrl) {
          setAvatarUrl(data.publicUrl);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Avatar upload error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setErrorMsg('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.trim(),
          full_name: fullName.trim() || null,
          bio: bio.trim() || null,
          location: location.trim() || null,
          avatar_url: avatarUrl.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        setErrorMsg(error.message);
      } else {
        await refreshProfile();
        router.push('/profile');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return <div className="text-center font-mono py-12 text-[#F9F5F2]">Checking session...</div>;
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#F9F5F2] hover:text-[#F4ED36]"
      >
        <ArrowLeft className="w-4 h-4" /> Cancel & Return
      </Link>

      <div className="card-riso p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="font-['Archivo_Black',sans-serif] text-2xl text-[#1A1A1A] uppercase tracking-tight">
            Edit Profile
          </h1>
          <p className="font-mono text-xs text-[#61609A] mt-1">
            Update your public profile, bio, and workshop location.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#C94245] border-2 border-[#1A1A1A] text-[#F9F5F2] font-mono text-xs rounded-[6px]">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar Preview & Upload */}
          <div className="flex items-center gap-4 pb-2 border-b-2 border-[#1A1A1A]/10">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-16 h-16 rounded-full border-2 border-[#1A1A1A] object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#F4ED36] border-2 border-[#1A1A1A] flex items-center justify-center font-['Archivo_Black',sans-serif] text-xl">
                {(username || 'U')[0]?.toUpperCase()}
              </div>
            )}

            <div className="space-y-2">
              <label className="btn-pill btn-pill-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingAvatar ? 'Uploading...' : 'Upload Avatar'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </label>
              <input
                type="url"
                placeholder="Or paste avatar image URL"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="input-riso text-xs py-1"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
              Username *
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-riso"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
              Full Name / Workshop Title
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-riso"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
              Bio / Specialties
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Salvage carpenter specializing in 19th-century pine and industrial iron fittings."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="input-riso resize-none text-xs"
            ></textarea>
          </div>

          <div>
            <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
              Workshop / Pickup Location
            </label>
            <input
              type="text"
              placeholder="e.g. Austin, TX (Warehouse District)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input-riso"
            />
          </div>

          <div className="pt-4 border-t-2 border-[#1A1A1A] flex items-center justify-end gap-3">
            <Link href="/profile" className="btn-pill btn-pill-white text-xs font-bold">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn-pill btn-pill-yellow text-xs font-bold flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
