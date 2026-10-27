'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, SlidersHorizontal, Loader2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Listing } from '@/types/database';
import ListingCard from '@/components/ListingCard';

const CATEGORIES = [
  'All',
  'Wood',
  'Metal',
  'Fabric',
  'Furniture',
  'Construction',
  'Glass',
  'Plastic',
  'Other',
];

const CONDITIONS = [
  { value: 'all', label: 'All Conditions' },
  { value: 'new', label: 'New / Surplus' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'salvage', label: 'Salvage / Raw' },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());

  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'All';

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    async function searchListings() {
      setLoading(true);
      try {
        let q = supabase
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
          .eq('is_available', true);

        if (query.trim()) {
          // ilike search on title or description
          q = q.or(`title.ilike.%${query.trim()}%,description.ilike.%${query.trim()}%`);
        }

        if (selectedCategory !== 'All') {
          q = q.eq('category', selectedCategory);
        }

        if (selectedCondition !== 'all') {
          q = q.eq('condition', selectedCondition);
        }

        if (minPrice && !isNaN(Number(minPrice))) {
          q = q.gte('price', Number(minPrice));
        }

        if (maxPrice && !isNaN(Number(maxPrice))) {
          q = q.lte('price', Number(maxPrice));
        }

        if (sortBy === 'newest') {
          q = q.order('created_at', { ascending: false });
        } else if (sortBy === 'price_asc') {
          q = q.order('price', { ascending: true });
        } else if (sortBy === 'price_desc') {
          q = q.order('price', { ascending: false });
        }

        const { data, error } = await q;
        if (error) {
          console.error('Error querying search:', error);
        } else {
          setListings((data as Listing[]) || []);
        }
      } catch (err) {
        console.error('Exception querying search:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      searchListings();
    }, 250);

    return () => clearTimeout(timer);
  }, [supabase, query, selectedCategory, selectedCondition, minPrice, maxPrice, sortBy]);

  const clearFilters = () => {
    setQuery('');
    setSelectedCategory('All');
    setSelectedCondition('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="card-riso p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex-1 relative flex items-center">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A] pointer-events-none z-10" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords, dimensions, materials..."
            className="input-riso !pl-11 !pr-11 text-sm font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#1A1A1A] hover:text-[#C94245] z-10 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden btn-pill btn-pill-white text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-[#1A1A1A] font-bold hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-[#F9F5F2] border-2 border-[#1A1A1A] rounded-full px-3 py-1.5 font-bold text-xs text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Desktop Sidebar Filters */}
        <aside
          className={`card-riso p-5 space-y-6 ${
            mobileFilterOpen ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#1A1A1A]">
            <div className="flex items-center gap-2 font-['Archivo_Black',sans-serif] text-sm text-[#1A1A1A] uppercase">
              <SlidersHorizontal className="w-4 h-4 text-[#1A1A1A]" />
              <span>Filters</span>
            </div>
            <button
              onClick={clearFilters}
              className="font-mono text-[11px] font-bold text-[#C94245] hover:underline"
            >
              Reset All
            </button>
          </div>

          {/* Category */}
          <div>
            <h4 className="font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-2">
              Category
            </h4>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left font-mono text-xs py-1 px-2 rounded-[4px] transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#F4ED36] text-[#1A1A1A] font-bold border border-[#1A1A1A]'
                      : 'text-[#1A1A1A]/80 hover:bg-[#61609A]/15'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div>
            <h4 className="font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-2">
              Condition
            </h4>
            <div className="space-y-1">
              {CONDITIONS.map((cond) => (
                <button
                  key={cond.value}
                  onClick={() => setSelectedCondition(cond.value)}
                  className={`w-full text-left font-mono text-xs py-1 px-2 rounded-[4px] transition-colors ${
                    selectedCondition === cond.value
                      ? 'bg-[#F9CC73] text-[#1A1A1A] font-bold border border-[#1A1A1A]'
                      : 'text-[#1A1A1A]/80 hover:bg-[#61609A]/15'
                  }`}
                >
                  {cond.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h4 className="font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-2">
              Rentang Harga (Rp)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min (Rp)"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="input-riso py-1 text-xs"
              />
              <input
                type="number"
                placeholder="Max (Rp)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="input-riso py-1 text-xs"
              />
            </div>
          </div>
        </aside>

        {/* Listings Result Grid */}
        <div className="md:col-span-3 space-y-4">
          <div className="flex items-center justify-between text-[#F9F5F2] font-mono text-xs">
            <span>
              {loading ? 'Searching...' : `Found ${listings.length} item${listings.length === 1 ? '' : 's'}`}
            </span>
            {(query || selectedCategory !== 'All' || selectedCondition !== 'all') && (
              <span className="text-[#F4ED36]">Filtered results</span>
            )}
          </div>

          {loading ? (
            <div className="card-riso p-12 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#1A1A1A]" />
              <p className="font-mono text-sm font-bold text-[#1A1A1A]">
                Searching marketplace inventory...
              </p>
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((item) => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          ) : (
            <div className="card-riso p-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-[#F8C1BA] border-2 border-[#1A1A1A] rounded-full flex items-center justify-center text-2xl">
                🔍
              </div>
              <div>
                <h3 className="font-['Archivo_Black',sans-serif] text-xl text-[#1A1A1A]">
                  No matching materials found
                </h3>
                <p className="font-mono text-xs text-[#61609A] max-w-sm mx-auto mt-1">
                  Try adjusting your search keywords, broadening category filters, or resetting price bounds.
                </p>
              </div>
              <button
                onClick={clearFilters}
                className="btn-pill btn-pill-yellow text-xs font-bold"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center font-mono text-sm text-[#F9F5F2]">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
