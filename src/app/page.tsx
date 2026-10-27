'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight, 
  Layers, 
  ShieldCheck, 
  Recycle, 
  Search,
  PlusCircle,
  Loader2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Listing } from '@/types/database';
import ListingCard from '@/components/ListingCard';

const CATEGORIES = [
  { name: 'All', icon: '✨' },
  { name: 'Wood', icon: '🪵' },
  { name: 'Metal', icon: '⚙️' },
  { name: 'Fabric', icon: '🧵' },
  { name: 'Furniture', icon: '🪑' },
  { name: 'Construction', icon: '🧱' },
  { name: 'Glass', icon: '🪟' },
  { name: 'Plastic', icon: '🧴' },
  { name: 'Other', icon: '📦' },
];

export default function HomePage() {
  const [supabase] = useState(() => createClient());
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      try {
        let query = supabase
          .from('listings')
          .select(`
            *,
            profiles:seller_id (
              username,
              full_name,
              avatar_url,
              seller_rating,
              total_sales
            )
          `)
          .eq('is_available', true)
          .order('created_at', { ascending: false });

        if (selectedCategory !== 'All') {
          query = query.eq('category', selectedCategory);
        }

        const { data, error } = await query;
        if (error) {
          console.error('Error fetching listings:', error);
        } else {
          setListings((data as Listing[]) || []);
        }
      } catch (err) {
        console.error('Exception fetching listings:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, [supabase, selectedCategory]);

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Section */}
      <section className="card-riso-dark p-6 sm:p-10 relative overflow-hidden">
        {/* Decorative corner tag */}
        <div className="inline-flex items-center gap-1.5 bg-[#F4ED36] text-[#1A1A1A] font-mono text-xs font-bold px-3 py-1 rounded-full border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Saturday Morning Circular Confessional</span>
        </div>

        <div className="max-w-3xl space-y-4">
          <h1 className="font-['Archivo_Black',sans-serif] text-3xl sm:text-5xl lg:text-6xl text-[#F4ED36] leading-[0.95] tracking-tight uppercase">
            Rescue Surplus. <br />
            Build Something <span className="text-[#F8C1BA]">Iconic</span>.
          </h1>

          <p className="font-sans text-sm sm:text-base text-[#F9F5F2]/90 max-w-2xl leading-relaxed">
            The community-driven marketplace for reclaimed lumber, metal cutoffs, salvaged vintage fixtures, and surplus building supplies. Turn architectural offcuts into raw creativity.
          </p>

          {/* Quick Search & CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/search"
              className="btn-pill btn-pill-yellow text-xs sm:text-sm flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Browse Catalog</span>
            </Link>

            <Link
              href="/listings/create"
              className="btn-pill btn-pill-white text-xs sm:text-sm flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post A Listing</span>
            </Link>
          </div>
        </div>

        {/* Floating Confetti Badges */}
        <div className="hidden md:block absolute -right-4 -bottom-4 w-56 p-4 bg-[#F9F5F2] text-[#1A1A1A] border-2 border-[#1A1A1A] rounded-[6px] shadow-[4px_4px_0px_#1A1A1A] rotate-2">
          <div className="font-mono text-[10px] text-[#61609A] uppercase font-bold">
            Community Impact
          </div>
          <div className="font-['Archivo_Black',sans-serif] text-2xl text-[#C94245]">
            100% RECLAIMED
          </div>
          <p className="font-mono text-[11px] text-[#1A1A1A] mt-1">
            Zero materials sent to incinerators or landfills.
          </p>
        </div>
      </section>

      {/* Category Pills Strip */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-['Archivo_Black',sans-serif] text-xl text-[#F4ED36] uppercase tracking-wide">
            Browse By Category
          </h2>
          <Link
            href="/search"
            className="font-mono text-xs font-bold text-[#F9F5F2] hover:text-[#F4ED36] flex items-center gap-1"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`btn-pill text-xs py-2 px-4 whitespace-nowrap transition-all ${
                  isActive
                    ? 'btn-pill-yellow scale-105'
                    : 'bg-[#61609A] text-[#F9F5F2] hover:bg-[#F9F5F2] hover:text-[#1A1A1A]'
                }`}
              >
                <span className="mr-1.5">{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Listings Feed */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#1A1A1A] pb-2">
          <div>
            <h2 className="font-['Archivo_Black',sans-serif] text-2xl text-[#F9F5F2] uppercase">
              {selectedCategory === 'All' ? 'Latest Salvage & Materials' : `${selectedCategory} Materials`}
            </h2>
            <p className="font-mono text-xs text-[#F9CC73]">
              {loading ? 'Refreshing listings...' : `${listings.length} item${listings.length === 1 ? '' : 's'} available right now`}
            </p>
          </div>

          <Link
            href="/listings/create"
            className="btn-pill btn-pill-matcha text-xs py-1.5 px-3 flex items-center gap-1 font-bold"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Sell Your Scrap
          </Link>
        </div>

        {loading ? (
          <div className="card-riso p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#1A1A1A]" />
            <p className="font-mono text-sm font-bold text-[#1A1A1A]">
              Fetching materials from Supabase...
            </p>
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        ) : (
          <div className="card-riso p-10 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-[#F4ED36] border-2 border-[#1A1A1A] rounded-full flex items-center justify-center text-2xl">
              📦
            </div>
            <div>
              <h3 className="font-['Archivo_Black',sans-serif] text-xl text-[#1A1A1A]">
                No listings in {selectedCategory} yet!
              </h3>
              <p className="font-mono text-xs text-[#61609A] max-w-sm mx-auto mt-1">
                Have leftover lumber, pipes, tiles, or offcuts in your workshop? Be the first to list in this category.
              </p>
            </div>
            <Link
              href="/listings/create"
              className="btn-pill btn-pill-yellow text-sm font-bold inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Listing</span>
            </Link>
          </div>
        )}
      </section>

      {/* Mission / Value Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="card-riso p-6">
          <div className="w-10 h-10 bg-[#B5C995] border-2 border-[#1A1A1A] rounded-full flex items-center justify-center mb-3">
            <Recycle className="w-5 h-5 text-[#1A1A1A]" />
          </div>
          <h3 className="font-['Archivo_Black',sans-serif] text-lg text-[#1A1A1A] uppercase">
            Direct Circularity
          </h3>
          <p className="font-mono text-xs text-[#1A1A1A]/80 mt-1.5 leading-relaxed">
            Eliminate skips and landfill runs. Every surplus piece find its home with a designer, builder, or weekend artisan.
          </p>
        </div>

        <div className="card-riso p-6">
          <div className="w-10 h-10 bg-[#F4ED36] border-2 border-[#1A1A1A] rounded-full flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5 text-[#1A1A1A]" />
          </div>
          <h3 className="font-['Archivo_Black',sans-serif] text-lg text-[#1A1A1A] uppercase">
            Fair Offer System
          </h3>
          <p className="font-mono text-xs text-[#1A1A1A]/80 mt-1.5 leading-relaxed">
            Send structured purchase requests with quantity requirements, negotiate in real-time chat, and agree before pickup.
          </p>
        </div>

        <div className="card-riso p-6">
          <div className="w-10 h-10 bg-[#F8C1BA] border-2 border-[#1A1A1A] rounded-full flex items-center justify-center mb-3">
            <Layers className="w-5 h-5 text-[#1A1A1A]" />
          </div>
          <h3 className="font-['Archivo_Black',sans-serif] text-lg text-[#1A1A1A] uppercase">
            Condition Transparency
          </h3>
          <p className="font-mono text-xs text-[#1A1A1A]/80 mt-1.5 leading-relaxed">
            Honest condition grading from &apos;Like New&apos; factory surplus to raw &apos;Salvage&apos; structural beams.
          </p>
        </div>
      </section>
    </div>
  );
}
