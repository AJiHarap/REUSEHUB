'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  User as UserIcon, 
  MapPin, 
  Star, 
  Package, 
  Edit, 
  Calendar, 
  Loader2 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Listing } from '@/types/database';
import ListingCard from '@/components/ListingCard';

export default function ProfilePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [supabase] = useState(() => createClient());
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      if (!user) return;
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('listings')
          .select(`
            *,
            profiles:seller_id (
              username,
              full_name,
              avatar_url,
              seller_rating
            )
          `)
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });

        if (data) {
          setUserListings(data as Listing[]);
        }
      } catch (err) {
        console.error('Error loading profile listings:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [supabase, user]);

  if (authLoading) {
    return <div className="text-center font-mono py-12 text-[#F9F5F2]">Checking session...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 card-riso p-8 text-center space-y-4">
        <h2 className="font-['Archivo_Black',sans-serif] text-xl text-[#1A1A1A]">
          My Profile
        </h2>
        <p className="font-mono text-xs text-[#61609A]">
          Please sign in to view and customize your profile.
        </p>
        <Link href="/auth/login" className="btn-pill btn-pill-yellow text-xs font-bold inline-block">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Profile Banner Card */}
      <div className="card-riso p-6 sm:p-8 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-20 h-20 rounded-full border-2 border-[#1A1A1A] object-cover shadow-[2px_2px_0px_#1A1A1A]"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#F4ED36] border-2 border-[#1A1A1A] flex items-center justify-center font-['Archivo_Black',sans-serif] text-2xl text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]">
                {(profile?.username || user.email || 'U')[0].toUpperCase()}
              </div>
            )}

            <div>
              <h1 className="font-['Archivo_Black',sans-serif] text-2xl sm:text-3xl text-[#1A1A1A]">
                {profile?.full_name || profile?.username || 'Member'}
              </h1>
              <p className="font-mono text-xs text-[#61609A]">
                @{profile?.username || user.email?.split('@')[0]}
              </p>

              {profile?.location && (
                <div className="flex items-center gap-1 font-mono text-xs text-[#1A1A1A] mt-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C94245]" />
                  <span>{profile.location}</span>
                </div>
              )}
            </div>
          </div>

          <Link
            href="/profile/edit"
            className="btn-pill btn-pill-white text-xs py-2 px-4 flex items-center gap-1.5 font-bold"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </Link>
        </div>

        {profile?.bio && (
          <div className="mt-6 pt-4 border-t-2 border-[#1A1A1A]/10 font-sans text-sm text-[#1A1A1A]/90">
            {profile.bio}
          </div>
        )}

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t-2 border-[#1A1A1A]/10 font-mono text-xs text-center">
          <div className="bg-[#61609A]/10 p-3 rounded-[6px] border border-[#1A1A1A]/20">
            <span className="text-[#61609A] block text-[10px] uppercase font-bold">Seller Rating</span>
            <span className="font-bold text-base text-[#1A1A1A] flex items-center justify-center gap-1 mt-0.5">
              <Star className="w-4 h-4 fill-[#F4ED36] text-[#1A1A1A]" />
              {profile?.seller_rating ? profile.seller_rating.toFixed(1) : '5.0'}
            </span>
          </div>

          <div className="bg-[#61609A]/10 p-3 rounded-[6px] border border-[#1A1A1A]/20">
            <span className="text-[#61609A] block text-[10px] uppercase font-bold">Total Sales</span>
            <span className="font-bold text-base text-[#1A1A1A] block mt-0.5">
              {profile?.total_sales || 0}
            </span>
          </div>

          <div className="bg-[#61609A]/10 p-3 rounded-[6px] border border-[#1A1A1A]/20">
            <span className="text-[#61609A] block text-[10px] uppercase font-bold">Listings</span>
            <span className="font-bold text-base text-[#1A1A1A] block mt-0.5">
              {userListings.length}
            </span>
          </div>
        </div>
      </div>

      {/* User's Listings */}
      <div className="space-y-4">
        <h2 className="font-['Archivo_Black',sans-serif] text-2xl text-[#F9F5F2] uppercase">
          Materials Listed by @{profile?.username}
        </h2>

        {loading ? (
          <div className="card-riso p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#1A1A1A] mx-auto" />
            <p className="font-mono text-xs text-[#1A1A1A] mt-2">Loading items...</p>
          </div>
        ) : userListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {userListings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        ) : (
          <div className="card-riso p-10 text-center space-y-3">
            <p className="font-mono text-xs text-[#61609A]">
              You haven&apos;t posted any items yet.
            </p>
            <Link
              href="/listings/create"
              className="btn-pill btn-pill-yellow text-xs font-bold inline-block"
            >
              Post an Item
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
