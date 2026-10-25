'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Package, 
  DollarSign, 
  Clock, 
  Trash2, 
  Edit, 
  Eye, 
  Loader2, 
  CheckCircle, 
  XCircle 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Listing } from '@/types/database';

export default function SellerDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [supabase] = useState(() => createClient());

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadSellerData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Fetch user's listings
      const { data: listingsData } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (listingsData) {
        setMyListings(listingsData as Listing[]);
      }

      // 2. Fetch pending requests
      const { count } = await supabase
        .from('purchase_requests')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', user.id)
        .eq('status', 'pending');

      setPendingRequestsCount(count || 0);
    } catch (err) {
      console.error('Error fetching seller stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellerData();
  }, [supabase, user]);

  const handleDelete = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)
        .eq('seller_id', user?.id);

      if (error) {
        alert('Could not delete: ' + error.message);
      } else {
        setMyListings((prev) => prev.filter((l) => l.id !== listingId));
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting listing');
    }
  };

  const toggleAvailability = async (listingId: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ is_available: !current })
        .eq('id', listingId)
        .eq('seller_id', user?.id);

      if (!error) {
        setMyListings((prev) =>
          prev.map((l) => (l.id === listingId ? { ...l, is_available: !current } : l))
        );
      }
    } catch (err) {
      console.error('Error toggling availability:', err);
    }
  };

  if (authLoading) {
    return <div className="text-center font-mono py-12 text-[#F9F5F2]">Checking session...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 card-riso p-8 text-center space-y-4">
        <h2 className="font-['Archivo_Black',sans-serif] text-xl text-[#1A1A1A]">
          Seller Dashboard
        </h2>
        <p className="font-mono text-xs text-[#61609A]">
          Please sign in to access your inventory and sales dashboard.
        </p>
        <Link href="/auth/login" className="btn-pill btn-pill-yellow text-xs font-bold inline-block">
          Sign In
        </Link>
      </div>
    );
  }

  const activeListings = myListings.filter((l) => l.is_available);
  const totalValue = myListings.reduce((sum, l) => sum + (l.quantity * Number(l.price)), 0);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#1A1A1A] pb-3">
        <div>
          <h1 className="font-['Archivo_Black',sans-serif] text-3xl text-[#F9F5F2] uppercase">
            Seller Dashboard
          </h1>
          <p className="font-mono text-xs text-[#F9CC73] mt-0.5">
            Overview of your inventory, requests, and recycling metrics
          </p>
        </div>

        <Link
          href="/listings/create"
          className="btn-pill btn-pill-yellow text-xs py-2 px-4 flex items-center gap-1.5 font-bold self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Material Listing</span>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-riso p-5">
          <span className="font-mono text-[11px] font-bold text-[#61609A] uppercase block">
            Active Inventory
          </span>
          <div className="font-['Archivo_Black',sans-serif] text-3xl text-[#1A1A1A] mt-1 flex items-baseline justify-between">
            <span>{activeListings.length}</span>
            <span className="font-mono text-xs text-[#61609A] font-normal">/ {myListings.length} total</span>
          </div>
        </div>

        <div className="card-riso p-5">
          <span className="font-mono text-[11px] font-bold text-[#61609A] uppercase block">
            Pending Orders
          </span>
          <div className="font-['Archivo_Black',sans-serif] text-3xl text-[#C94245] mt-1 flex items-baseline justify-between">
            <span>{pendingRequestsCount}</span>
            <Link href="/requests" className="font-mono text-xs underline text-[#1A1A1A]">
              Review
            </Link>
          </div>
        </div>

        <div className="card-riso p-5">
          <span className="font-mono text-[11px] font-bold text-[#61609A] uppercase block">
            Completed Sales
          </span>
          <div className="font-['Archivo_Black',sans-serif] text-3xl text-[#B5C995] mt-1">
            {profile?.total_sales || 0}
          </div>
        </div>

        <div className="card-riso p-5">
          <span className="font-mono text-[11px] font-bold text-[#61609A] uppercase block">
            Inventory Value
          </span>
          <div className="font-['Archivo_Black',sans-serif] text-3xl text-[#1A1A1A] mt-1">
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Listings Inventory Table / Grid */}
      <div className="card-riso p-6 space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#1A1A1A]/10 pb-3">
          <h2 className="font-['Archivo_Black',sans-serif] text-xl text-[#1A1A1A] uppercase">
            Your Listed Materials
          </h2>
          <span className="font-mono text-xs text-[#61609A]">
            {myListings.length} item{myListings.length === 1 ? '' : 's'} listed
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#1A1A1A] mx-auto" />
            <p className="font-mono text-xs text-[#1A1A1A] mt-2">Loading inventory...</p>
          </div>
        ) : myListings.length > 0 ? (
          <div className="divide-y-2 divide-[#1A1A1A]/10">
            {myListings.map((item) => {
              const img = item.images?.[0] || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200';
              return (
                <div
                  key={item.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={img}
                      alt={item.title}
                      className="w-14 h-14 rounded-[6px] border border-[#1A1A1A] object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/listings/${item.id}`}
                        className="font-['Archivo_Black',sans-serif] text-base text-[#1A1A1A] hover:underline truncate block"
                      >
                        {item.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 mt-1 font-mono text-xs">
                        <span className="font-bold text-[#1A1A1A]">${item.price}</span>
                        <span className="text-[#61609A]">({item.quantity} {item.unit || 'units'})</span>
                        <span className="text-[#61609A]">• {item.category}</span>
                        <span
                          className={`px-2 py-0.2 rounded-full border border-[#1A1A1A] text-[10px] font-bold ${
                            item.is_available
                              ? 'bg-[#B5C995] text-[#1A1A1A]'
                              : 'bg-[#C94245] text-[#F9F5F2]'
                          }`}
                        >
                          {item.is_available ? 'Available' : 'Reserved/Sold'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleAvailability(item.id, item.is_available)}
                      className="btn-pill btn-pill-white text-[11px] py-1 px-2.5 font-mono"
                      title="Toggle availability"
                    >
                      {item.is_available ? 'Mark Sold' : 'Mark Available'}
                    </button>

                    <Link
                      href={`/listings/${item.id}/edit`}
                      className="p-2 border border-[#1A1A1A] rounded-[4px] hover:bg-[#F9CC73] transition-colors"
                      title="Edit listing"
                    >
                      <Edit className="w-3.5 h-3.5 text-[#1A1A1A]" />
                    </Link>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 border border-[#1A1A1A] rounded-[4px] hover:bg-[#F8C1BA] text-[#C94245] transition-colors"
                      title="Delete listing"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center space-y-3">
            <p className="font-mono text-xs text-[#61609A]">
              You haven&apos;t posted any materials yet.
            </p>
            <Link
              href="/listings/create"
              className="btn-pill btn-pill-yellow text-xs font-bold inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post Your First Item</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
