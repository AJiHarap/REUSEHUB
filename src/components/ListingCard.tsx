'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, MapPin, Star, Eye } from 'lucide-react';
import { Listing } from '@/types/database';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface ListingCardProps {
  listing: Listing;
  isFavoritedInitially?: boolean;
  onFavoriteChange?: (isFav: boolean) => void;
}

const conditionLabels: Record<string, { label: string; class: string }> = {
  new: { label: 'New', class: 'badge-new' },
  like_new: { label: 'Like New', class: 'badge-like_new' },
  good: { label: 'Good', class: 'badge-good' },
  fair: { label: 'Fair', class: 'badge-fair' },
  salvage: { label: 'Salvage', class: 'badge-salvage' },
};

export default function ListingCard({
  listing,
  isFavoritedInitially = false,
  onFavoriteChange,
}: ListingCardProps) {
  const { user } = useAuth();
  const [supabase] = useState(() => createClient());
  const [isFavorited, setIsFavorited] = useState(isFavoritedInitially || !!listing.is_favorited);
  const [loadingFav, setLoadingFav] = useState(false);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Please sign in to save items to your favorites.');
      return;
    }

    if (loadingFav) return;
    setLoadingFav(true);

    const nextState = !isFavorited;
    setIsFavorited(nextState);
    if (onFavoriteChange) onFavoriteChange(nextState);

    try {
      if (nextState) {
        await supabase.from('favorites').insert({
          user_id: user.id,
          listing_id: listing.id,
        });
      } else {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', listing.id);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      // rollback
      setIsFavorited(!nextState);
    } finally {
      setLoadingFav(false);
    }
  };

  const conditionInfo = conditionLabels[listing.condition] || {
    label: listing.condition,
    class: 'badge-good',
  };

  const primaryImage =
    listing.images && listing.images.length > 0
      ? listing.images[0]
      : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80';

  return (
    <div className="card-riso group flex flex-col h-full overflow-hidden relative">
      {/* Top Image Banner */}
      <div className="relative aspect-[4/3] bg-[#61609A]/20 overflow-hidden border-b-2 border-[#1A1A1A]">
        <img
          src={primaryImage}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Condition Tag */}
        <div className="absolute top-2.5 left-2.5">
          <span className={`badge-pill ${conditionInfo.class}`}>
            {conditionInfo.label}
          </span>
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={toggleFavorite}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full border-2 border-[#1A1A1A] transition-colors shadow-[2px_2px_0px_#1A1A1A] ${
            isFavorited
              ? 'bg-[#C94245] text-[#F9F5F2]'
              : 'bg-[#F9F5F2] text-[#1A1A1A] hover:bg-[#F8C1BA]'
          }`}
          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`}
          />
        </button>

        {/* Category Pill Tag */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="font-mono text-[10px] font-bold bg-[#1A1A1A] text-[#F9F5F2] px-2 py-0.5 rounded-full border border-[#F4ED36]">
            {listing.category}
          </span>
        </div>

        {/* View Count */}
        {listing.view_count > 0 && (
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-[#1A1A1A]/80 text-[#F9F5F2] font-mono text-[10px] px-2 py-0.5 rounded-full backdrop-blur-xs">
            <Eye className="w-3 h-3" />
            <span>{listing.view_count}</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/listings/${listing.id}`} className="block">
            <h3 className="font-['Archivo_Black',sans-serif] text-base text-[#1A1A1A] leading-tight line-clamp-1 group-hover:text-[#61609A] transition-colors">
              {listing.title}
            </h3>
          </Link>

          <p className="font-sans text-xs text-[#1A1A1A]/80 line-clamp-2 mt-1.5 leading-relaxed">
            {listing.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[#1A1A1A]/20 flex items-end justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase text-[#61609A] font-bold">
              Price
            </div>
            <div className="font-['Archivo_Black',sans-serif] text-lg text-[#1A1A1A]">
              ${Number(listing.price).toLocaleString()}
              {listing.unit && listing.unit !== 'piece' && (
                <span className="font-mono text-xs text-[#61609A] font-normal">
                  /{listing.unit}
                </span>
              )}
            </div>
          </div>

          {listing.location && (
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#61609A] truncate max-w-[120px]">
              <MapPin className="w-3 h-3 text-[#C94245] shrink-0" />
              <span className="truncate">{listing.location}</span>
            </div>
          )}
        </div>

        {/* Seller Info strip */}
        <div className="mt-3 pt-2 border-t border-[#1A1A1A]/10 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5 truncate">
            {listing.profiles?.avatar_url ? (
              <img
                src={listing.profiles.avatar_url}
                alt="Seller"
                className="w-4 h-4 rounded-full border border-[#1A1A1A] object-cover"
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-[#F4ED36] border border-[#1A1A1A] flex items-center justify-center text-[9px] font-bold">
                {(listing.profiles?.username || 'S')[0].toUpperCase()}
              </div>
            )}
            <span className="truncate font-semibold text-[#1A1A1A]">
              {listing.profiles?.username || 'Seller'}
            </span>
          </div>

          {listing.profiles?.seller_rating ? (
            <div className="flex items-center gap-0.5 text-[#1A1A1A] font-bold">
              <Star className="w-3 h-3 fill-[#F4ED36] text-[#1A1A1A]" />
              <span>{listing.profiles.seller_rating.toFixed(1)}</span>
            </div>
          ) : (
            <span className="text-[#61609A] text-[10px]">Active</span>
          )}
        </div>
      </div>
    </div>
  );
}
