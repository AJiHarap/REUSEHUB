'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Upload, 
  Plus, 
  X, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
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

const CONDITIONS: { value: ListingCondition; label: string; desc: string }[] = [
  { value: 'new', label: 'New', desc: 'Brand new surplus or uninstalled stock' },
  { value: 'like_new', label: 'Like New', desc: 'Virtually no signs of wear, flawless condition' },
  { value: 'good', label: 'Good', desc: 'Minor cosmetic wear, fully structurally sound' },
  { value: 'fair', label: 'Fair', desc: 'Noticeable wear or patina, ready for rework' },
  { value: 'salvage', label: 'Salvage', desc: 'Demolition salvage, raw cuts, rustic character' },
];

const UNITS = ['piece', 'meter', 'kg', 'sqft', 'board-foot', 'pallet', 'lot'];

export default function CreateListingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [supabase] = useState(() => createClient());

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [condition, setCondition] = useState<ListingCondition>('good');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('piece');
  const [location, setLocation] = useState('');

  // Image management
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!user) {
      alert('Please sign in first.');
      return;
    }

    setUploadingFiles(true);
    setErrorMsg('');
    const newImageUrls: string[] = [];

    try {
      for (const file of Array.from(e.target.files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(fileName, file, { upsert: true });

        if (uploadError) {
          console.warn('Storage upload warning:', uploadError);
          // If storage fails, we can convert to base64 preview or alert
          setErrorMsg(`Note: Storage upload failed (${uploadError.message}). You can also enter direct image URLs.`);
        } else {
          const { data } = supabase.storage
            .from('listing-images')
            .getPublicUrl(fileName);

          if (data?.publicUrl) {
            newImageUrls.push(data.publicUrl);
          }
        }
      }

      if (newImageUrls.length > 0) {
        setImages((prev) => [...prev, ...newImageUrls]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error during file upload');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setImages((prev) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (images.length === 0) {
      // Add a default stock placeholder for convenience if none provided
      images.push('https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80');
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase
        .from('listings')
        .insert({
          seller_id: user.id,
          title: title.trim(),
          description: description.trim(),
          price: parseFloat(price),
          category,
          condition,
          images,
          quantity: Number(quantity),
          unit,
          location: location.trim() || null,
          is_available: true,
        })
        .select('id')
        .single();

      if (error) {
        setErrorMsg(error.message);
      } else if (data) {
        // Also ensure user is marked as seller
        await supabase
          .from('profiles')
          .update({ is_seller: true })
          .eq('id', user.id);

        router.push(`/listings/${data.id}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="text-center font-mono py-12 text-[#F9F5F2]">Checking session...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 card-riso p-8 text-center space-y-4">
        <h2 className="font-['Archivo_Black',sans-serif] text-2xl text-[#1A1A1A]">
          Authentication Required
        </h2>
        <p className="font-mono text-xs text-[#61609A]">
          You need an account to list reclaimed materials and surplus items.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/auth/login" className="btn-pill btn-pill-yellow text-xs font-bold">
            Sign In
          </Link>
          <Link href="/auth/register" className="btn-pill btn-pill-white text-xs font-bold">
            Sign Up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#F9F5F2] hover:text-[#F4ED36] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Back
        </Link>
      </div>

      <div className="card-riso p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="font-['Archivo_Black',sans-serif] text-2xl sm:text-3xl text-[#1A1A1A] uppercase tracking-tight">
            Post Material or Salvage
          </h1>
          <p className="font-mono text-xs text-[#61609A] mt-1">
            Give unused goods, timber, hardware, or fixtures a new home.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#C94245] border-2 border-[#1A1A1A] text-[#F9F5F2] font-mono text-xs rounded-[6px]">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images Section */}
          <div className="space-y-3">
            <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A]">
              Photos & Documentation (Upload or URL)
            </label>

            {/* Thumbnail preview list */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square border-2 border-[#1A1A1A] rounded-[6px] overflow-hidden group bg-[#61609A]/20"
                  >
                    <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-[#C94245] text-[#F9F5F2] p-1 rounded-full border border-[#1A1A1A] opacity-90 hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload buttons & URL input */}
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="btn-pill btn-pill-white text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer border-dashed border-2">
                <Upload className="w-4 h-4" />
                <span>{uploadingFiles ? 'Uploading...' : 'Upload Photos'}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingFiles}
                />
              </label>

              <div className="flex-1 flex gap-2">
                <input
                  type="url"
                  placeholder="Or paste image URL (https://...)"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="input-riso text-xs py-1.5"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="btn-pill btn-pill-white text-xs py-1.5 px-3"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
              Title / Material Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 5x Reclaimed Douglas Fir Beams (8ft x 6in)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-riso"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
              Description, Dimensions & Origin *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Detail the materials, previous use (e.g. salvaged from barn roof), exact dimensions, defects, or handling requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-riso resize-y"
            ></textarea>
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
                Category *
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
                Condition *
              </label>
              <select
                value={condition}
                onChange={(e: any) => setCondition(e.target.value)}
                className="input-riso font-bold cursor-pointer"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label} ({c.desc})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price, Quantity & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
                Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="45.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input-riso font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#1A1A1A] mb-1">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
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
              Pickup Location / City
            </label>
            <input
              type="text"
              placeholder="e.g. East Warehouse District, Austin TX"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input-riso"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t-2 border-[#1A1A1A] flex items-center justify-end gap-3">
            <Link
              href="/"
              className="btn-pill btn-pill-white text-xs font-bold"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn-pill btn-pill-yellow text-sm font-bold flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Publish Listing</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
