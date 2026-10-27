'use client';

import React, { useEffect, useState, use, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  MapPin,
  Truck,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  CreditCard,
  ShoppingBag
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Listing, UserProfile } from '@/types/database';
import { useAuth } from '@/context/AuthContext';
import { formatRupiah } from '@/lib/format';

function CheckoutContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const listingId = resolvedParams.id;
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [supabase] = useState(() => createClient());

  const [listing, setListing] = useState<Listing | null>(null);
  const [sellerProfile, setSellerProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states for checkout & delivery address
  const [quantity, setQuantity] = useState(1);
  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [cityDistrict, setCityDistrict] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [buyerNotes, setBuyerNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pre-fill user profile info if available
  useEffect(() => {
    if (profile) {
      if (!recipientName) {
        setRecipientName(profile.full_name || profile.username || '');
      }
      if (!cityDistrict && profile.location) {
        setCityDistrict(profile.location);
      }
    }
  }, [profile]);

  useEffect(() => {
    async function fetchListing() {
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
              location,
              seller_rating,
              total_sales
            )
          `)
          .eq('id', listingId)
          .single();

        if (error || !data) {
          console.error('Error fetching listing for checkout:', error);
          setListing(null);
        } else {
          setListing(data as Listing);
          if (data.profiles) {
            setSellerProfile(data.profiles as unknown as UserProfile);
          }
        }
      } catch (err) {
        console.error('Exception in checkout fetchListing:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchListing();
  }, [supabase, listingId]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      router.push(`/auth/login?redirect=/checkout/${listingId}`);
      return;
    }

    if (!listing) return;

    if (user.id === listing.seller_id) {
      setErrorMessage('Anda tidak dapat membeli material milik sendiri.');
      return;
    }

    if (quantity < 1) {
      setErrorMessage('Jumlah pesanan minimal 1.');
      return;
    }

    if (quantity > listing.quantity) {
      setErrorMessage(`Jumlah melebihi stok yang tersedia (${listing.quantity} ${listing.unit || 'unit'}).`);
      return;
    }

    if (!streetAddress.trim() || !cityDistrict.trim() || !phoneNumber.trim()) {
      setErrorMessage('Harap lengkapi nomor telepon, alamat lengkap, dan kota/wilayah pengiriman.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Kurangi stok listing di database
      const newQuantity = Math.max(0, listing.quantity - quantity);
      const isAvailable = newQuantity > 0;

      const { error: stockUpdateError } = await supabase
        .from('listings')
        .update({
          quantity: newQuantity,
          is_available: isAvailable,
          updated_at: new Date().toISOString(),
        })
        .eq('id', listing.id);

      if (stockUpdateError) {
        throw new Error('Gagal memperbarui stok barang: ' + stockUpdateError.message);
      }

      // 2. Format pesan lengkap dengan detail alamat pengiriman
      const fullMessage = [
        `[ALAMAT PENGIRIMAN & DETAIL ORDER]`,
        `Nama Penerima: ${recipientName.trim()}`,
        `No. Telepon / WA: ${phoneNumber.trim()}`,
        `Alamat: ${streetAddress.trim()}, ${cityDistrict.trim()}${postalCode ? ` (${postalCode.trim()})` : ''}`,
        `Metode: ${deliveryMethod === 'pickup' ? 'Ambil di Lokasi Penjual (Pickup Sendiri)' : 'Pengiriman via Kurir / Ekspedisi'}`,
        buyerNotes.trim() ? `Catatan: ${buyerNotes.trim()}` : '',
      ].filter(Boolean).join('\n');

      // 3. Simpan ke purchase_requests
      const { error: requestError } = await supabase
        .from('purchase_requests')
        .insert({
          listing_id: listing.id,
          buyer_id: user.id,
          seller_id: listing.seller_id,
          quantity: quantity,
          message: fullMessage,
          status: 'pending',
        });

      if (requestError) {
        // Rollback stok jika insert gagal
        await supabase
          .from('listings')
          .update({
            quantity: listing.quantity,
            is_available: listing.is_available,
          })
          .eq('id', listing.id);

        throw new Error('Gagal membuat pesanan: ' + requestError.message);
      }

      // 4. Update profile location if not set yet
      if (profile && !profile.location && cityDistrict.trim()) {
        await supabase
          .from('profiles')
          .update({ location: cityDistrict.trim() })
          .eq('id', user.id);
      }

      // Perbarui local listing state
      setListing({
        ...listing,
        quantity: newQuantity,
        is_available: isAvailable,
      });

      setOrderSuccess(true);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses pesanan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="card-riso p-16 text-center flex flex-col items-center justify-center gap-3 max-w-xl mx-auto my-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A1A1A]" />
        <p className="font-mono text-sm font-bold text-[#1A1A1A]">
          Menyiapkan halaman checkout & alamat...
        </p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="card-riso p-12 text-center space-y-4 max-w-xl mx-auto my-12">
        <h2 className="font-['Archivo_Black',sans-serif] text-2xl text-[#C94245]">
          Material Tidak Ditemukan
        </h2>
        <p className="font-mono text-xs text-[#61609A]">
          Item ini mungkin sudah dihapus atau tidak lagi tersedia.
        </p>
        <Link href="/" className="btn-pill btn-pill-yellow text-xs font-bold inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Katalog
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card-riso p-10 text-center space-y-4 max-w-md mx-auto my-12">
        <ShoppingBag className="w-10 h-10 mx-auto text-[#1A1A1A]" />
        <h2 className="font-['Archivo_Black',sans-serif] text-xl text-[#1A1A1A]">
          Masuk untuk Melanjutkan Checkout
        </h2>
        <p className="font-mono text-xs text-[#61609A]">
          Silakan masuk atau daftar akun terlebih dahulu untuk melengkapi alamat pengiriman dan memesan barang.
        </p>
        <Link
          href={`/auth/login?redirect=/checkout/${listing.id}`}
          className="btn-pill btn-pill-yellow text-xs font-bold inline-block"
        >
          Masuk Sekarang
        </Link>
      </div>
    );
  }

  if (listing.quantity <= 0 || !listing.is_available) {
    return (
      <div className="card-riso p-12 text-center space-y-4 max-w-xl mx-auto my-12">
        <div className="w-16 h-16 bg-[#F8C1BA] border-2 border-[#1A1A1A] rounded-full flex items-center justify-center mx-auto text-2xl">
          📦
        </div>
        <h2 className="font-['Archivo_Black',sans-serif] text-2xl text-[#C94245]">
          Stok Habis
        </h2>
        <p className="font-mono text-xs text-[#61609A]">
          Maaf, material ini baru saja habis terjual atau sedang direservasi oleh pembeli lain.
        </p>
        <Link href="/" className="btn-pill btn-pill-yellow text-xs font-bold inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Cari Material Lain
        </Link>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="max-w-2xl mx-auto my-8 space-y-6">
        <div className="card-riso p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-[#B5C995] border-2 border-[#1A1A1A] rounded-full flex items-center justify-center mx-auto shadow-[2px_2px_0px_#1A1A1A]">
            <CheckCircle2 className="w-10 h-10 text-[#1A1A1A]" />
          </div>

          <div>
            <span className="badge-pill badge-new text-[11px] mb-2 inline-block">
              Pesanan Berhasil Dikirim
            </span>
            <h1 className="font-['Archivo_Black',sans-serif] text-2xl sm:text-3xl text-[#1A1A1A] uppercase">
              Checkout Selesai!
            </h1>
            <p className="font-mono text-xs text-[#61609A] mt-2 max-w-md mx-auto">
              Permintaan pembelian dan alamat pengiriman Anda telah dikirimkan ke penjual (@{sellerProfile?.username || 'seller'}). Stok barang telah otomatis berkurang.
            </p>
          </div>

          {/* Ringkasan Pesanan Sukses */}
          <div className="p-4 bg-[#F9F5F2] border-2 border-[#1A1A1A] rounded-[6px] text-left space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2">
              <span className="text-[#61609A]">Barang:</span>
              <span className="font-bold text-[#1A1A1A]">{listing.title}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2">
              <span className="text-[#61609A]">Jumlah:</span>
              <span className="font-bold text-[#1A1A1A]">{quantity} {listing.unit || 'unit'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2">
              <span className="text-[#61609A]">Total Pembayaran:</span>
              <span className="font-bold text-sm text-[#1A1A1A]">{formatRupiah(quantity * listing.price)}</span>
            </div>
            <div className="flex items-start justify-between pt-1">
              <span className="text-[#61609A] shrink-0">Alamat Kirim:</span>
              <span className="font-semibold text-right text-[#1A1A1A] max-w-[260px]">
                {streetAddress}, {cityDistrict} {postalCode && `(${postalCode})`}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/requests"
              className="w-full sm:w-auto btn-pill btn-pill-yellow text-xs font-bold px-6 py-2.5 flex items-center justify-center gap-2"
            >
              <span>Lihat Daftar Pesanan</span>
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto btn-pill btn-pill-white text-xs font-bold px-6 py-2.5 flex items-center justify-center gap-2"
            >
              <span>Belanja Material Lain</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const primaryImage = listing.images && listing.images.length > 0
    ? listing.images[0]
    : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80';

  const totalPrice = quantity * Number(listing.price);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Back button */}
      <div>
        <Link
          href={`/listings/${listing.id}`}
          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#F9F5F2] hover:text-[#F4ED36] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Detail Produk</span>
        </Link>
      </div>

      {/* Header */}
      <div className="border-b-2 border-[#1A1A1A] pb-3">
        <h1 className="font-['Archivo_Black',sans-serif] text-2xl sm:text-3xl text-[#F9F5F2] uppercase">
          Halaman Checkout & Alamat Pengiriman
        </h1>
        <p className="font-mono text-xs text-[#F9CC73] mt-0.5">
          Lengkapi data alamat dan rincian pesanan untuk menyelesaikan transaksi
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-[#F8C1BA] border-2 border-[#1A1A1A] rounded-[6px] text-[#1A1A1A] font-mono text-xs flex items-center gap-2 shadow-[2px_2px_0px_#1A1A1A]">
          <AlertCircle className="w-5 h-5 text-[#C94245] shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Kolom Kiri: Form Alamat & Pengiriman (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card-riso p-6 space-y-5">
            <div className="flex items-center gap-2 border-b-2 border-[#1A1A1A]/10 pb-3">
              <MapPin className="w-5 h-5 text-[#C94245]" />
              <h2 className="font-['Archivo_Black',sans-serif] text-lg text-[#1A1A1A] uppercase">
                1. Alamat Pengiriman / Penerima
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
                  Nama Penerima *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Nama Lengkap Penerima"
                    className="input-riso font-sans text-xs w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
                  Nomor Telepon / WhatsApp *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="input-riso font-mono text-xs w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
                Alamat Lengkap (Jalan, No. Rumah, RT/RW, Patokan) *
              </label>
              <textarea
                rows={3}
                required
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="Jl. Raya WR Supratman No. 45, RT 02/RW 03, Pagar Dewa (Depan Toko Berkah)"
                className="input-riso font-sans text-xs w-full resize-none"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
                  Kota / Kabupaten & Kecamatan *
                </label>
                <input
                  type="text"
                  required
                  value={cityDistrict}
                  onChange={(e) => setCityDistrict(e.target.value)}
                  placeholder="Kota Bengkulu, Kec. Selebar"
                  className="input-riso font-sans text-xs w-full"
                />
              </div>

              <div>
                <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
                  Kode Pos (Opsional)
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="38229"
                  className="input-riso font-mono text-xs w-full"
                />
              </div>
            </div>
          </div>

          {/* Opsi Pengiriman */}
          <div className="card-riso p-6 space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-[#1A1A1A]/10 pb-3">
              <Truck className="w-5 h-5 text-[#61609A]" />
              <h2 className="font-['Archivo_Black',sans-serif] text-lg text-[#1A1A1A] uppercase">
                2. Metode Pengambilan / Pengiriman
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-4 rounded-[6px] border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  deliveryMethod === 'pickup'
                    ? 'border-[#1A1A1A] bg-[#F4ED36]/30 shadow-[3px_3px_0px_#1A1A1A]'
                    : 'border-[#1A1A1A]/20 bg-white hover:border-[#1A1A1A]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="pickup"
                    checked={deliveryMethod === 'pickup'}
                    onChange={() => setDeliveryMethod('pickup')}
                    className="accent-[#1A1A1A]"
                  />
                  <span className="font-['Archivo_Black',sans-serif] text-xs text-[#1A1A1A]">
                    Ambil Sendiri (Pickup)
                  </span>
                </div>
                <p className="font-mono text-[11px] text-[#61609A] mt-2 leading-relaxed">
                  Lokasi Penjual: <span className="font-bold text-[#1A1A1A]">{listing.location || 'Bengkulu'}</span>. Tanpa biaya kirim.
                </p>
              </label>

              <label
                className={`p-4 rounded-[6px] border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  deliveryMethod === 'delivery'
                    ? 'border-[#1A1A1A] bg-[#F4ED36]/30 shadow-[3px_3px_0px_#1A1A1A]'
                    : 'border-[#1A1A1A]/20 bg-white hover:border-[#1A1A1A]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="delivery"
                    checked={deliveryMethod === 'delivery'}
                    onChange={() => setDeliveryMethod('delivery')}
                    className="accent-[#1A1A1A]"
                  />
                  <span className="font-['Archivo_Black',sans-serif] text-xs text-[#1A1A1A]">
                    Jasa Kirim / Kurir
                  </span>
                </div>
                <p className="font-mono text-[11px] text-[#61609A] mt-2 leading-relaxed">
                  Kirim via kurir lokal / ekspedisi. Biaya ongkir disepakati langsung dengan penjual.
                </p>
              </label>
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
                Catatan Tambahan untuk Penjual (Opsional)
              </label>
              <textarea
                rows={2}
                value={buyerNotes}
                onChange={(e) => setBuyerNotes(e.target.value)}
                placeholder="Contoh: Bisa diambil hari Minggu pagi dengan pick-up. Tolong bantu siapkan tali pengikat."
                className="input-riso font-sans text-xs w-full resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Ringkasan Produk & Pembayaran (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card-riso p-6 space-y-5">
            <h2 className="font-['Archivo_Black',sans-serif] text-lg text-[#1A1A1A] uppercase border-b-2 border-[#1A1A1A]/10 pb-3">
              Ringkasan Material
            </h2>

            {/* Product card preview */}
            <div className="flex gap-3 items-center">
              <img
                src={primaryImage}
                alt={listing.title}
                className="w-16 h-16 rounded-[6px] border-2 border-[#1A1A1A] object-cover shrink-0"
              />
              <div className="min-w-0">
                <span className="font-mono text-[10px] font-bold bg-[#1A1A1A] text-[#F9F5F2] px-2 py-0.5 rounded-full">
                  {listing.category}
                </span>
                <h3 className="font-['Archivo_Black',sans-serif] text-sm text-[#1A1A1A] truncate mt-1">
                  {listing.title}
                </h3>
                <p className="font-mono text-xs font-bold text-[#C94245]">
                  {formatRupiah(listing.price)} <span className="font-normal text-[#61609A]">/ {listing.unit || 'unit'}</span>
                </p>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="p-3 bg-[#61609A]/10 border border-[#1A1A1A]/20 rounded-[4px] space-y-2">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="font-bold text-[#1A1A1A]">Jumlah Beli:</span>
                <span className="text-[#61609A]">
                  Stok Tersedia: <strong className="text-[#1A1A1A]">{listing.quantity} {listing.unit || 'unit'}</strong>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-8 h-8 rounded-[4px] border-2 border-[#1A1A1A] bg-white text-[#1A1A1A] font-bold disabled:opacity-40"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={listing.quantity}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setQuantity(Math.min(listing.quantity, Math.max(1, val)));
                  }}
                  className="input-riso font-mono text-center font-bold text-sm w-20 py-1"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(listing.quantity, quantity + 1))}
                  disabled={quantity >= listing.quantity}
                  className="w-8 h-8 rounded-[4px] border-2 border-[#1A1A1A] bg-white text-[#1A1A1A] font-bold disabled:opacity-40"
                >
                  +
                </button>
                <span className="font-mono text-xs text-[#61609A]">
                  {listing.unit || 'unit'}
                </span>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 font-mono text-xs pt-2 border-t border-[#1A1A1A]/10">
              <div className="flex justify-between text-[#61609A]">
                <span>Harga Satuan:</span>
                <span className="text-[#1A1A1A]">{formatRupiah(listing.price)}</span>
              </div>
              <div className="flex justify-between text-[#61609A]">
                <span>Jumlah:</span>
                <span className="text-[#1A1A1A]">{quantity} {listing.unit || 'unit'}</span>
              </div>
              <div className="flex justify-between text-[#61609A]">
                <span>Ongkos Kirim:</span>
                <span className="text-[#1A1A1A]">
                  {deliveryMethod === 'pickup' ? 'Gratis (Ambil Sendiri)' : 'Sesuai Kesepakatan'}
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm text-[#1A1A1A] pt-3 border-t-2 border-[#1A1A1A]">
                <span>Total Tagihan:</span>
                <span className="text-base text-[#C94245]">
                  {formatRupiah(totalPrice)}
                </span>
              </div>
            </div>

            {/* Garansi ReUseHub notice */}
            <div className="p-3 bg-[#B5C995]/20 border border-[#1A1A1A]/20 rounded-[4px] flex items-start gap-2 font-mono text-[11px] text-[#1A1A1A]">
              <ShieldCheck className="w-4 h-4 text-[#1A1A1A] shrink-0 mt-0.5" />
              <span>
                Dengan menekan checkout, stok barang akan otomatis dipotong dan penjual akan segera diberitahu untuk konfirmasi.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-pill btn-pill-yellow text-sm font-bold py-3 flex items-center justify-center gap-2 shadow-[3px_3px_0px_#1A1A1A]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Checkout...</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Konfirmasi & Checkout Sekarang</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="card-riso p-16 text-center font-mono text-sm text-[#1A1A1A] max-w-xl mx-auto my-12">
          Memuat halaman checkout...
        </div>
      }
    >
      <CheckoutContent params={params} />
    </Suspense>
  );
}
