'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Package, 
  Loader2, 
  ArrowRight,
  MessageSquare,
  MapPin
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { PurchaseRequest, PurchaseRequestStatus } from '@/types/database';
import { formatRupiah } from '@/lib/format';

export default function PurchaseRequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const [supabase] = useState(() => createClient());
  const [activeTab, setActiveTab] = useState<'buying' | 'selling'>('buying');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadRequests = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      let query = supabase
        .from('purchase_requests')
        .select(`
          *,
          listings:listing_id (
            id,
            title,
            images,
            price,
            unit
          ),
          buyer:buyer_id (
            id,
            username,
            full_name,
            avatar_url
          ),
          seller:seller_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (activeTab === 'buying') {
        query = query.eq('buyer_id', user.id);
      } else {
        query = query.eq('seller_id', user.id);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching requests:', error);
      } else if (data) {
        setRequests(data);
      }
    } catch (err) {
      console.error('Exception fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [supabase, user, activeTab]);

  const updateStatus = async (requestId: string, nextStatus: PurchaseRequestStatus) => {
    setUpdatingId(requestId);
    try {
      // Jika pesanan ditolak, kembalikan stok listing
      if (nextStatus === 'declined') {
        const targetReq = requests.find((r) => r.id === requestId);
        if (targetReq && targetReq.listing_id && targetReq.quantity) {
          const { data: currentListing } = await supabase
            .from('listings')
            .select('quantity')
            .eq('id', targetReq.listing_id)
            .single();

          if (currentListing) {
            await supabase
              .from('listings')
              .update({
                quantity: currentListing.quantity + targetReq.quantity,
                is_available: true,
                updated_at: new Date().toISOString(),
              })
              .eq('id', targetReq.listing_id);
          }
        }
      }

      const { error } = await supabase
        .from('purchase_requests')
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) {
        alert('Could not update request: ' + error.message);
      } else {
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: nextStatus } : r))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading) {
    return <div className="text-center font-mono py-12 text-[#F9F5F2]">Checking session...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 card-riso p-8 text-center space-y-4">
        <h2 className="font-['Archivo_Black',sans-serif] text-xl text-[#1A1A1A]">
          Purchase Requests
        </h2>
        <p className="font-mono text-xs text-[#61609A]">
          Sign in to view purchase requests sent or received.
        </p>
        <Link href="/auth/login" className="btn-pill btn-pill-yellow text-xs font-bold inline-block">
          Sign In
        </Link>
      </div>
    );
  }

  const statusStyles: Record<string, { label: string; bg: string; text: string }> = {
    pending: { label: 'Pending Review', bg: 'bg-[#F9CC73]', text: 'text-[#1A1A1A]' },
    accepted: { label: 'Accepted', bg: 'bg-[#B5C995]', text: 'text-[#1A1A1A]' },
    declined: { label: 'Declined', bg: 'bg-[#C94245]', text: 'text-[#F9F5F2]' },
    completed: { label: 'Completed', bg: 'bg-[#F4ED36]', text: 'text-[#1A1A1A]' },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="border-b-2 border-[#1A1A1A] pb-3">
        <h1 className="font-['Archivo_Black',sans-serif] text-3xl text-[#F9F5F2] uppercase">
          Purchase Requests
        </h1>
        <p className="font-mono text-xs text-[#F9CC73] mt-0.5">
          Manage material orders, inquiries, and status updates
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('buying')}
          className={`btn-pill text-xs py-2 px-5 font-bold ${
            activeTab === 'buying' ? 'btn-pill-yellow' : 'btn-pill-white'
          }`}
        >
          Buying Requests Sent
        </button>
        <button
          onClick={() => setActiveTab('selling')}
          className={`btn-pill text-xs py-2 px-5 font-bold ${
            activeTab === 'selling' ? 'btn-pill-yellow' : 'btn-pill-white'
          }`}
        >
          Selling Requests Received
        </button>
      </div>

      {loading ? (
        <div className="card-riso p-16 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1A1A1A]" />
          <p className="font-mono text-sm font-bold text-[#1A1A1A]">
            Loading purchase requests...
          </p>
        </div>
      ) : requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((req) => {
            const listing = req.listings;
            const buyer = req.buyer;
            const seller = req.seller;
            const status = statusStyles[req.status] || {
              label: req.status,
              bg: 'bg-[#F9CC73]',
              text: 'text-[#1A1A1A]',
            };

            const totalPrice = listing ? req.quantity * Number(listing.price) : 0;

            return (
              <div key={req.id} className="card-riso p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#1A1A1A]/10 pb-3">
                  <div className="flex items-center gap-3">
                    {listing?.images?.[0] ? (
                      <img
                        src={listing.images[0]}
                        alt="listing"
                        className="w-12 h-12 rounded-[6px] border border-[#1A1A1A] object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-[#61609A]/20 border border-[#1A1A1A] rounded-[6px] flex items-center justify-center">
                        <Package className="w-6 h-6 text-[#1A1A1A]" />
                      </div>
                    )}
                    <div>
                      <Link
                        href={`/listings/${req.listing_id}`}
                        className="font-['Archivo_Black',sans-serif] text-base text-[#1A1A1A] hover:underline"
                      >
                        {listing?.title || 'Unknown Material'}
                      </Link>
                      <p className="font-mono text-xs text-[#61609A]">
                        {activeTab === 'buying' ? (
                          <>Seller: @{seller?.username || 'seller'}</>
                        ) : (
                          <>Buyer: @{buyer?.username || 'buyer'}</>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-xs font-bold px-3 py-1 rounded-full border-2 border-[#1A1A1A] uppercase ${status.bg} ${status.text}`}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="bg-[#61609A]/10 p-2.5 rounded-[4px] border border-[#1A1A1A]/20">
                    <span className="text-[#61609A] block text-[10px] uppercase font-bold">Quantity</span>
                    <span className="font-bold text-[#1A1A1A]">
                      {req.quantity} {listing?.unit || 'units'}
                    </span>
                  </div>

                  <div className="bg-[#61609A]/10 p-2.5 rounded-[4px] border border-[#1A1A1A]/20">
                    <span className="text-[#61609A] block text-[10px] uppercase font-bold">Total Harga</span>
                    <span className="font-bold text-[#1A1A1A] text-sm">
                      {formatRupiah(totalPrice)}
                    </span>
                  </div>

                  <div className="bg-[#61609A]/10 p-2.5 rounded-[4px] border border-[#1A1A1A]/20">
                    <span className="text-[#61609A] block text-[10px] uppercase font-bold">Tanggal Pesan</span>
                    <span className="font-bold text-[#1A1A1A]">
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {req.message && (
                  <div className="p-3.5 bg-[#F9F5F2] border-2 border-[#1A1A1A] rounded-[6px] space-y-1">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#1A1A1A] uppercase border-b border-[#1A1A1A]/10 pb-1">
                      <MapPin className="w-3.5 h-3.5 text-[#C94245]" />
                      <span>Detail Pengiriman & Catatan Pembeli</span>
                    </div>
                    <p className="font-mono text-xs text-[#1A1A1A] whitespace-pre-wrap leading-relaxed pt-1">
                      {req.message}
                    </p>
                  </div>
                )}

                {/* Seller Actions */}
                {activeTab === 'selling' && (
                  <div className="pt-2 border-t border-[#1A1A1A]/10 flex flex-wrap items-center justify-end gap-2">
                    {req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(req.id, 'accepted')}
                          disabled={updatingId === req.id}
                          className="btn-pill btn-pill-matcha text-xs py-1.5 px-3 flex items-center gap-1 font-bold"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Accept Request
                        </button>
                        <button
                          onClick={() => updateStatus(req.id, 'declined')}
                          disabled={updatingId === req.id}
                          className="btn-pill btn-pill-red text-xs py-1.5 px-3 flex items-center gap-1 font-bold"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Decline
                        </button>
                      </>
                    )}

                    {req.status === 'accepted' && (
                      <button
                        onClick={() => updateStatus(req.id, 'completed')}
                        disabled={updatingId === req.id}
                        className="btn-pill btn-pill-yellow text-xs py-1.5 px-3 flex items-center gap-1 font-bold"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Mark Completed & Picked Up
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-riso p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-[#B5C995] border-2 border-[#1A1A1A] rounded-full flex items-center justify-center text-2xl">
            🤝
          </div>
          <h3 className="font-['Archivo_Black',sans-serif] text-xl text-[#1A1A1A]">
            No {activeTab} purchase requests
          </h3>
          <p className="font-mono text-xs text-[#61609A] max-w-sm mx-auto">
            {activeTab === 'buying'
              ? "You haven't submitted any purchase requests yet. Find materials in the catalog to send offers!"
              : "No buyers have submitted purchase requests for your listings yet."}
          </p>
          {activeTab === 'buying' && (
            <Link href="/search" className="btn-pill btn-pill-yellow text-xs font-bold inline-block">
              Browse Materials
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
