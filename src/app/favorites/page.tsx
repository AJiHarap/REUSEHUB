'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Listing } from '@/types/database';
import ListingCard from '@/components/ListingCard';

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const [supabase] = useState(() => createClient());
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFavorites() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select(`
            listing_id,
            listings:listing_id (
              *,
              profiles:seller_id (
                username,
                full_name,
                avatar_url,
                seller_rating
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching favorites:', error);
        } else if (data) {
          const list = data
            .map((item: any) => item.listings)
            .filter((item: any) => item !== null) as Listing[];
          setFavorites(list);
        }
      } catch (err) {
        console.error('Exception fetching favorites:', err);
      } finally {
        setLoading(false);
      }
    }

    loadFavorites();
  }, [supabase, user]);

  if (authLoading) {
    return <div className="text-center font-mono py-12 text-[#F9F5F2]">Checking session...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 card-riso p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-[#F8C1BA] border-2 border-[#1A1A1A] rounded-full flex items-center justify-center mx-auto">
          <Heart className="w-6 h-6 text-[#1A1A1A]" />
        </div>
        <h2 className="font-['Archivo_Black',sans-serif] text-xl text-[#1A1A1A]">
          Your Favorites
        </h2>
        <p className="font-mono text-xs text-[#61609A]">
          Please sign in to save materials and view your collection.
        </p>
        <Link href="/auth/login" className="btn-pill btn-pill-yellow text-xs font-bold inline-block">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between border-b-2 border-[#1A1A1A] pb-3">
        <div>
          <h1 className="font-['Archivo_Black',sans-serif] text-3xl text-[#F9F5F2] uppercase">
            Saved Favorites
          </h1>
          <p className="font-mono text-xs text-[#F9CC73] mt-0.5">
            {favorites.length} saved material{favorites.length === 1 ? '' : 's'}
          </p>
        </div>

        <Link
          href="/"
          className="btn-pill btn-pill-white text-xs py-1.5 px-3 font-mono flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to browse
        </Link>
      </div>

      {loading ? (
        <div className="card-riso p-16 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1A1A1A]" />
          <p className="font-mono text-sm font-bold text-[#1A1A1A]">
            Loading saved materials...
          </p>
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((item) => (
            <ListingCard
              key={item.id}
              listing={item}
              isFavoritedInitially={true}
              onFavoriteChange={(isFav) => {
                if (!isFav) {
                  setFavorites((prev) => prev.filter((f) => f.id !== item.id));
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="card-riso p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-[#F8C1BA] border-2 border-[#1A1A1A] rounded-full flex items-center justify-center text-2xl">
            💛
          </div>
          <h3 className="font-['Archivo_Black',sans-serif] text-xl text-[#1A1A1A]">
            No saved favorites yet
          </h3>
          <p className="font-mono text-xs text-[#61609A] max-w-sm mx-auto">
            Click the heart icon on any listing while browsing to bookmark materials for your upcoming projects.
          </p>
          <Link
            href="/search"
            className="btn-pill btn-pill-yellow text-xs font-bold inline-flex items-center gap-1.5"
          >
            <span>Explore Materials</span> <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
