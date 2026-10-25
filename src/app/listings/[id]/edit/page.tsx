'use client';

import React, { useEffect, useState, use, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, X, Upload, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { ListingCondition } from '@/types/database';

const CATEGORIES = [
  'Wood',
  'Metal',
  'Fabric',
  'Furniture',
  'Construction',
  'Glass',
  'Plastic',
  'Other',
];

const CONDITIONS: { value: ListingCondition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'salvage', label: 'Salvage' },
];

const UNITS = ['piece', 'meter', 'kg', 'sqft', 'board-foot', 'pallet', 'lot'];

function EditListingContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const listingId = resolvedParams.id;
  const router = useRouter();
  const { user } = useAuth();
  const [supabase] = useState(() => createClient());

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [condition, setCondition] = useState<ListingCondition>('good');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('piece');
  const [location, setLocation] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  useEffect(() => {
    async function fetchListing() {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', listingId)
          .single();

        if (error || !data) {
          setErrorMsg('Listing not found');
        } else {
          if (user && data.seller_id !== user.id) {
            router.push(`/listings/${listingId}`);
            return;
          }
          setTitle(data.title);
          setDescription(data.description);
          setPrice(data.price.toString());
          setCategory(data.category);
          setCondition(data.condition as ListingCondition);
          setQuantity(data.quantity);
          setUnit(data.unit || 'piece');
          setLocation(data.location || '');
          setIsAvailable(data.is_available);
          setImages(data.images || []);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error fetching listing');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchListing();
    }
  }, [supabase, listingId, user, router]);

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addImageUrl = () => {
    if (imageUrlInput.trim()) {
      setImages((prev) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const { error } = await supabase
        .from('listings')
        .update({
          title: title.trim(),
          description: description.trim(),
          price: parseFloat(price),
          category,
          condition,
          quantity: Number(quantity),
          unit,
          location: location.trim() || null,
          is_available: isAvailable,
          images,
          updated_at: new Date().toISOString(),
        })
        .eq('id', listingId)
        .eq('seller_id', user.id);

      if (error) {
        setErrorMsg(error.message);
      } else {
        router.push(`/listings/${listingId}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update listing');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="card-riso p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A1A1A] mx-auto" />
        <p className="font-mono text-sm text-[#1A1A1A] mt-2">Loading listing...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <Link
        href={`/listings/${listingId}`}
        className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#F9F5F2] hover:text-[#F4ED36]"
      >
        <ArrowLeft className="w-4 h-4" /> Cancel & Return
      </Link>

      <div className="card-riso p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="font-['Archivo_Black',sans-serif] text-2xl text-[#1A1A1A] uppercase tracking-tight">
            Edit Listing
          </h1>
          <p className="font-mono text-xs text-[#61609A]">
            Update material details or mark as available / reserved.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#C94245] border-2 border-[#1A1A1A] text-[#F9F5F2] font-mono text-xs rounded-[6px]">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Availability checkbox */}
          <div className="p-3 bg-[#B5C995]/40 border-2 border-[#1A1A1A] rounded-[6px] flex items-center gap-3">
            <input
              type="checkbox"
              id="isAvailable"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="w-4 h-4 accent-[#1A1A1A]"
            />
            <label htmlFor="isAvailable" className="font-mono text-xs font-bold text-[#1A1A1A] cursor-pointer">
              Listing is Available (Uncheck if item is reserved or sold)
            </label>
          </div>

          {/* Title */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-riso"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
              Description
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-riso resize-y"
            ></textarea>
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-riso font-bold cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
                Condition
              </label>
              <select
                value={condition}
                onChange={(e: any) => setCondition(e.target.value)}
                className="input-riso font-bold cursor-pointer"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price, Quantity, Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input-riso font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
                Quantity
              </label>
              <input
                type="number"
                min={0}
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="input-riso font-mono"
              />
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="input-riso font-bold cursor-pointer"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input-riso"
            />
          </div>

          {/* Images */}
          <div className="space-y-3">
            <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A]">
              Images
            </label>
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square border-2 border-[#1A1A1A] rounded-[6px] overflow-hidden">
                    <img src={img} alt="item" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-[#C94245] text-[#F9F5F2] p-1 rounded-full border border-[#1A1A1A]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Add image URL (https://...)"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="input-riso text-xs py-1.5"
              />
              <button
                type="button"
                onClick={addImageUrl}
                className="btn-pill btn-pill-white text-xs py-1.5 px-3"
              >
                Add
              </button>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-[#1A1A1A] flex items-center justify-end gap-3">
            <Link href={`/listings/${listingId}`} className="btn-pill btn-pill-white text-xs font-bold">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn-pill btn-pill-yellow text-xs font-bold flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="card-riso p-16 text-center font-mono text-sm text-[#1A1A1A]">
          Loading listing editor...
        </div>
      }
    >
      <EditListingContent params={params} />
    </Suspense>
  );
}
