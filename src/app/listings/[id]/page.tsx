'use client';

import React, { useEffect, useState, use, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Heart, 
  MapPin, 
  Star, 
  Package, 
  MessageSquare, 
  ShoppingBag, 
  ArrowLeft, 
  Eye, 
  Share2, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Listing, UserProfile } from '@/types/database';
import { useAuth } from '@/context/AuthContext';

const conditionLabels: Record<string, { label: string; class: string; desc: string }> = {
  new: { label: 'New / Unused Surplus', class: 'badge-new', desc: 'Brand new, never installed or used surplus material.' },
  like_new: { label: 'Like New', class: 'badge-like_new', desc: 'Minimal to no signs of wear, fully intact and clean.' },
  good: { label: 'Good', class: 'badge-good', desc: 'Normal cosmetic wear, mechanically sound and fully reusable.' },
  fair: { label: 'Fair', class: 'badge-fair', desc: 'Noticeable wear, surface rust or blemishes; ideal for refurbishment.' },
  salvage: { label: 'Salvage / Raw', class: 'badge-salvage', desc: 'Demolition salvage, raw cuts, or rustic reclaimed condition.' },
};

function ListingDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const listingId = resolvedParams.id;
  const router = useRouter();
  const { user } = useAuth();
  const [supabase] = useState(() => createClient());

  const [listing, setListing] = useState<Listing | null>(null);
  const [sellerProfile, setSellerProfile] = useState<UserProfile | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);

  // Purchase request modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestQty, setRequestQty] = useState(1);
  const [requestNote, setRequestNote] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Chat initiation state
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    async function loadListing() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('listings')
          .select(`
            *,
            profiles:seller_id (
              id,
              username,
              full_name,
              avatar_url,
              bio,
              location,
              seller_rating,
              total_sales,
              created_at
            )
          `)
          .eq('id', listingId)
          .single();

        if (error || !data) {
          console.error('Error fetching listing:', error);
          setListing(null);
        } else {
          setListing(data as Listing);
          if (data.profiles) {
            setSellerProfile(data.profiles as unknown as UserProfile);
          }

          // Trigger view count increment RPC
          supabase.rpc('increment_view_count', { listing_id: listingId }).then();
        }

        // Check if user has favorited
        if (user) {
          const { data: favData } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('listing_id', listingId)
            .maybeSingle();

          setIsFavorited(!!favData);
        }
      } catch (err) {
        console.error('Exception in loadListing:', err);
      } finally {
        setLoading(false);
      }
    }

    loadListing();
  }, [supabase, listingId, user]);

  const toggleFavorite = async () => {
    if (!user) {
      alert('Please sign in to save items to your favorites.');
      return;
    }

    const nextState = !isFavorited;
    setIsFavorited(nextState);

    try {
      if (nextState) {
        await supabase.from('favorites').insert({
          user_id: user.id,
          listing_id: listingId,
        });
      } else {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', listingId);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setIsFavorited(!nextState);
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!listing) return;
    if (user.id === listing.seller_id) {
      alert("You cannot start a conversation with yourself.");
      return;
    }

    setStartingChat(true);
    try {
      // Find or create conversation
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listing.id)
        .eq('buyer_id', user.id)
        .eq('seller_id', listing.seller_id)
        .maybeSingle();

      if (existingConv) {
        router.push(`/messages/${existingConv.id}`);
      } else {
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            listing_id: listing.id,
            buyer_id: user.id,
            seller_id: listing.seller_id,
            last_message: `Interested in "${listing.title}"`,
            last_message_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (error) {
          alert('Could not start conversation: ' + error.message);
        } else if (newConv) {
          // Send automatic greeting message
          await supabase.from('messages').insert({
            conversation_id: newConv.id,
            sender_id: user.id,
            content: `Hi! I'm interested in your listing: "${listing.title}". Is it still available?`,
          });
          router.push(`/messages/${newConv.id}`);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error starting chat');
    } finally {
      setStartingChat(false);
    }
  };

  const handleSendPurchaseRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!listing) return;

    setSubmittingRequest(true);
    try {
      const { error } = await supabase.from('purchase_requests').insert({
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        quantity: requestQty,
        message: requestNote.trim() || null,
        status: 'pending',
      });

      if (error) {
        alert('Failed to send request: ' + error.message);
      } else {
        setRequestSuccess(true);
        setTimeout(() => {
          setShowRequestModal(false);
          setRequestSuccess(false);
        }, 2000);
      }
    } catch (err: any) {
      alert(err.message || 'Error submitting purchase request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (error) {
        alert('Error deleting listing: ' + error.message);
      } else {
        router.push('/seller');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting listing');
    }
  };

  if (loading) {
    return (
      <div className="card-riso p-16 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A1A1A]" />
        <p className="font-mono text-sm font-bold text-[#1A1A1A]">
          Loading item specifications...
        </p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="card-riso p-12 text-center space-y-4">
        <h2 className="font-['Archivo_Black',sans-serif] text-2xl text-[#C94245]">
          Listing Not Found
        </h2>
        <p className="font-mono text-xs text-[#61609A]">
          This item may have been sold or removed by the seller.
        </p>
        <Link href="/" className="btn-pill btn-pill-yellow text-xs font-bold inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === listing.seller_id;
  const condition = conditionLabels[listing.condition] || {
    label: listing.condition,
    class: 'badge-good',
    desc: 'Good reusable state.',
  };

  const images = listing.images && listing.images.length > 0
    ? listing.images
    : ['https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80'];

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#F9F5F2] hover:text-[#F4ED36] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to marketplace</span>
        </Link>

        {isOwner && (
          <div className="flex items-center gap-2">
            <Link
              href={`/listings/${listing.id}/edit`}
              className="btn-pill btn-pill-white text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </Link>
            <button
              onClick={handleDeleteListing}
              className="btn-pill btn-pill-red text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Listing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Gallery Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card-riso overflow-hidden relative aspect-[4/3] bg-[#61609A]/20">
            <img
              src={images[activeImageIndex]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />

            <div className="absolute top-3 left-3 flex gap-2">
              <span className={`badge-pill ${condition.class}`}>
                {condition.label}
              </span>
              <span className="font-mono text-xs font-bold bg-[#1A1A1A] text-[#F9F5F2] px-2.5 py-0.5 rounded-full border border-[#F4ED36]">
                {listing.category}
              </span>
            </div>

            <button
              onClick={toggleFavorite}
              className={`absolute top-3 right-3 p-2.5 rounded-full border-2 border-[#1A1A1A] transition-colors shadow-[2px_2px_0px_#1A1A1A] ${
                isFavorited
                  ? 'bg-[#C94245] text-[#F9F5F2]'
                  : 'bg-[#F9F5F2] text-[#1A1A1A] hover:bg-[#F8C1BA]'
              }`}
              title={isFavorited ? 'Saved in favorites' : 'Add to favorites'}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
            </button>

            {listing.view_count > 0 && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-[#1A1A1A]/80 text-[#F9F5F2] font-mono text-xs px-2.5 py-1 rounded-full backdrop-blur-xs">
                <Eye className="w-3.5 h-3.5" />
                <span>{listing.view_count} views</span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 rounded-[6px] border-2 overflow-hidden shrink-0 transition-all ${
                    activeImageIndex === idx
                      ? 'border-[#F4ED36] ring-2 ring-[#1A1A1A] scale-105'
                      : 'border-[#1A1A1A] opacity-75 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Condition & Circularity details box */}
          <div className="card-riso p-5 space-y-2">
            <h4 className="font-['Archivo_Black',sans-serif] text-sm text-[#1A1A1A] uppercase">
              Material Condition: {condition.label}
            </h4>
            <p className="font-mono text-xs text-[#1A1A1A]/80 leading-relaxed">
              {condition.desc}
            </p>
          </div>
        </div>

        {/* Sidebar Info Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card-riso p-6 space-y-6">
            <div>
              <h1 className="font-['Archivo_Black',sans-serif] text-2xl sm:text-3xl text-[#1A1A1A] leading-tight">
                {listing.title}
              </h1>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-['Archivo_Black',sans-serif] text-3xl sm:text-4xl text-[#1A1A1A]">
                  ${Number(listing.price).toLocaleString()}
                </span>
                <span className="font-mono text-sm text-[#61609A]">
                  per {listing.unit || 'piece'}
                </span>
              </div>
            </div>

            {/* Quick Specs */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t-2 border-[#1A1A1A]/10 font-mono text-xs">
              <div className="bg-[#61609A]/10 p-2.5 rounded-[4px] border border-[#1A1A1A]/20">
                <span className="text-[#61609A] block text-[10px] uppercase font-bold">Available Quantity</span>
                <span className="font-bold text-[#1A1A1A] text-sm flex items-center gap-1 mt-0.5">
                  <Package className="w-3.5 h-3.5 text-[#1A1A1A]" />
                  {listing.quantity} {listing.unit || 'units'}
                </span>
              </div>

              <div className="bg-[#61609A]/10 p-2.5 rounded-[4px] border border-[#1A1A1A]/20">
                <span className="text-[#61609A] block text-[10px] uppercase font-bold">Pickup Location</span>
                <span className="font-bold text-[#1A1A1A] text-sm flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-[#C94245] shrink-0" />
                  <span className="truncate">{listing.location || 'Local Pickup'}</span>
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5 pt-2">
              <h3 className="font-mono text-xs font-bold uppercase text-[#1A1A1A]">
                Description & Origin
              </h3>
              <p className="font-sans text-sm text-[#1A1A1A]/90 whitespace-pre-wrap leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* Action Buttons */}
            {!isOwner ? (
              <div className="pt-4 border-t-2 border-[#1A1A1A] space-y-3">
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="w-full btn-pill btn-pill-yellow text-sm font-bold flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Send Purchase Request</span>
                </button>

                <button
                  onClick={handleStartChat}
                  disabled={startingChat}
                  className="w-full btn-pill btn-pill-white text-sm font-bold flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{startingChat ? 'Connecting...' : 'Chat with Seller'}</span>
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t-2 border-[#1A1A1A] bg-[#F4ED36]/30 p-3 rounded-[6px] border border-[#1A1A1A]">
                <p className="font-mono text-xs font-bold text-[#1A1A1A] text-center">
                  👑 This is your listing. Manage it from your seller dashboard.
                </p>
              </div>
            )}
          </div>

          {/* Seller Profile Card */}
          <div className="card-riso p-5 space-y-4">
            <div className="flex items-center gap-3">
              {sellerProfile?.avatar_url ? (
                <img
                  src={sellerProfile.avatar_url}
                  alt={sellerProfile.username}
                  className="w-12 h-12 rounded-full border-2 border-[#1A1A1A] object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#F4ED36] border-2 border-[#1A1A1A] flex items-center justify-center font-['Archivo_Black',sans-serif] text-lg text-[#1A1A1A]">
                  {(sellerProfile?.username || 'S')[0].toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h4 className="font-['Archivo_Black',sans-serif] text-base text-[#1A1A1A] truncate">
                  {sellerProfile?.full_name || sellerProfile?.username || 'ReUseHub Member'}
                </h4>
                <p className="font-mono text-xs text-[#61609A] truncate">
                  @{sellerProfile?.username || 'member'}
                </p>
              </div>
            </div>

            {sellerProfile?.bio && (
              <p className="font-sans text-xs text-[#1A1A1A]/80 italic">
                &ldquo;{sellerProfile.bio}&rdquo;
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1A1A1A]/10 font-mono text-xs">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-[#F4ED36] text-[#1A1A1A]" />
                <span className="font-bold text-[#1A1A1A]">
                  {sellerProfile?.seller_rating ? sellerProfile.seller_rating.toFixed(1) : 'New Seller'}
                </span>
              </div>
              <div className="text-right text-[#61609A]">
                {sellerProfile?.total_sales || 0} sales completed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/70 p-4 backdrop-blur-xs">
          <div className="card-riso max-w-md w-full p-6 space-y-4 relative animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-['Archivo_Black',sans-serif] text-xl text-[#1A1A1A] uppercase">
              Make Purchase Request
            </h3>
            <p className="font-mono text-xs text-[#61609A]">
              Send an official offer to the seller for &quot;{listing.title}&quot;.
            </p>

            {requestSuccess ? (
              <div className="p-4 bg-[#B5C995] border-2 border-[#1A1A1A] rounded-[6px] text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#1A1A1A] mx-auto" />
                <p className="font-['Archivo_Black',sans-serif] text-sm text-[#1A1A1A]">
                  Request Sent Successfully!
                </p>
                <p className="font-mono text-xs text-[#1A1A1A]">
                  The seller has been notified. You can track this under Purchase Requests.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendPurchaseRequest} className="space-y-4">
                <div>
                  <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
                    Quantity Required ({listing.unit || 'units'} available: {listing.quantity})
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={listing.quantity}
                    required
                    value={requestQty}
                    onChange={(e) => setRequestQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="input-riso font-mono"
                  />
                </div>

                <div className="p-3 bg-[#F9CC73]/30 border border-[#1A1A1A] rounded-[4px] font-mono text-xs flex justify-between">
                  <span>Estimated Total:</span>
                  <span className="font-bold text-sm text-[#1A1A1A]">
                    ${(requestQty * Number(listing.price)).toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
                    Pickup Note / Delivery Request
                  </label>
                  <textarea
                    rows={3}
                    value={requestNote}
                    onChange={(e) => setRequestNote(e.target.value)}
                    placeholder="e.g., Can pick up Saturday morning with a trailer. Would like to inspect prior."
                    className="input-riso resize-none text-xs"
                  ></textarea>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="flex-1 btn-pill btn-pill-white text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="flex-1 btn-pill btn-pill-yellow text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    {submittingRequest ? 'Sending...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="card-riso p-16 text-center font-mono text-sm text-[#1A1A1A]">
          Loading item specifications...
        </div>
      }
    >
      <ListingDetailContent params={params} />
    </Suspense>
  );
}
