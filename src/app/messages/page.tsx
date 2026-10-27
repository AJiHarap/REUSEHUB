'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Clock, ArrowRight, Loader2, User as UserIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Conversation, UserProfile } from '@/types/database';
import { formatRupiah } from '@/lib/format';

export default function MessagesListPage() {
  const { user, loading: authLoading } = useAuth();
  const [supabase] = useState(() => createClient());
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConversations() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            *,
            listings:listing_id (
              title,
              images,
              price
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
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .order('last_message_at', { ascending: false, nullsFirst: false });

        if (error) {
          console.error('Error fetching conversations:', error);
        } else if (data) {
          setConversations(data);
        }
      } catch (err) {
        console.error('Exception fetching conversations:', err);
      } finally {
        setLoading(false);
      }
    }

    loadConversations();
  }, [supabase, user]);

  if (authLoading) {
    return <div className="text-center font-mono py-12 text-[#F9F5F2]">Checking session...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 card-riso p-8 text-center space-y-4">
        <h2 className="font-['Archivo_Black',sans-serif] text-xl text-[#1A1A1A]">
          Messages
        </h2>
        <p className="font-mono text-xs text-[#61609A]">
          Please sign in to view your conversations and negotiate with buyers/sellers.
        </p>
        <Link href="/auth/login" className="btn-pill btn-pill-yellow text-xs font-bold inline-block">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="border-b-2 border-[#1A1A1A] pb-3">
        <h1 className="font-['Archivo_Black',sans-serif] text-3xl text-[#F9F5F2] uppercase">
          Messages & Inquiries
        </h1>
        <p className="font-mono text-xs text-[#F9CC73] mt-0.5">
          Real-time chat with buyers and material suppliers
        </p>
      </div>

      {loading ? (
        <div className="card-riso p-16 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1A1A1A]" />
          <p className="font-mono text-sm font-bold text-[#1A1A1A]">
            Loading conversation threads...
          </p>
        </div>
      ) : conversations.length > 0 ? (
        <div className="space-y-3">
          {conversations.map((conv) => {
            const isBuyer = conv.buyer_id === user.id;
            const otherUser = isBuyer ? conv.seller : conv.buyer;
            const listing = conv.listings;
            const thumbnail = listing?.images?.[0] || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200';

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="card-riso p-4 block hover:translate-x-1 transition-transform"
              >
                <div className="flex items-center gap-4">
                  {/* Other user avatar or listing thumb */}
                  <div className="relative shrink-0">
                    {otherUser?.avatar_url ? (
                      <img
                        src={otherUser.avatar_url}
                        alt="User"
                        className="w-12 h-12 rounded-full border-2 border-[#1A1A1A] object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#F4ED36] border-2 border-[#1A1A1A] flex items-center justify-center font-['Archivo_Black',sans-serif] text-base text-[#1A1A1A]">
                        {(otherUser?.username || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    {listing && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border border-[#1A1A1A] overflow-hidden bg-[#1A1A1A]">
                        <img src={thumbnail} alt="listing" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-['Archivo_Black',sans-serif] text-base text-[#1A1A1A] truncate">
                        {otherUser?.full_name || otherUser?.username || 'User'}
                      </h3>
                      {conv.last_message_at && (
                        <span className="font-mono text-[10px] text-[#61609A] shrink-0">
                          {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    {listing && (
                      <p className="font-mono text-xs font-bold text-[#61609A] truncate">
                        Re: {listing.title} ({formatRupiah(listing.price)})
                      </p>
                    )}

                    <p className="font-sans text-xs text-[#1A1A1A]/80 line-clamp-1 mt-1">
                      {conv.last_message || 'Started a conversation'}
                    </p>
                  </div>

                  <div className="shrink-0 text-[#1A1A1A]">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card-riso p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-[#F4ED36] border-2 border-[#1A1A1A] rounded-full flex items-center justify-center text-2xl">
            💬
          </div>
          <h3 className="font-['Archivo_Black',sans-serif] text-xl text-[#1A1A1A]">
            No conversations yet
          </h3>
          <p className="font-mono text-xs text-[#61609A] max-w-sm mx-auto">
            Browse items and click &quot;Chat with Seller&quot; on any listing to start direct messaging.
          </p>
          <Link
            href="/search"
            className="btn-pill btn-pill-yellow text-xs font-bold inline-block"
          >
            Browse Listings
          </Link>
        </div>
      )}
    </div>
  );
}
