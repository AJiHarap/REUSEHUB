'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  PlusCircle, 
  Heart, 
  MessageSquare, 
  ShoppingBag, 
  User as UserIcon, 
  LogOut, 
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#8584BD] border-b-2 border-[#1A1A1A] px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-[#F4ED36] border-2 border-[#1A1A1A] px-3 py-1 rounded-[6px] shadow-[2px_2px_0px_#1A1A1A] group-hover:translate-x-[-1px] group-hover:translate-y-[-1px] transition-transform">
            <span className="font-['Archivo_Black',sans-serif] text-xl tracking-tight text-[#1A1A1A] uppercase">
              ReUse<span className="text-[#C94245]">Hub</span>
            </span>
          </div>
          <span className="hidden sm:inline-block font-mono text-[11px] font-bold tracking-wider text-[#F9F5F2] uppercase bg-[#1A1A1A] px-2 py-0.5 rounded-full">
            Circularity
          </span>
        </Link>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:flex items-center relative">
          <Search className="absolute left-3.5 w-4 h-4 text-[#1A1A1A] pointer-events-none z-10" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reclaimed wood, metal, furniture..."
            className="w-full bg-[#F9F5F2] border-2 border-[#1A1A1A] rounded-full py-1.5 !pl-10 !pr-4 text-sm font-medium text-[#1A1A1A] placeholder-[#61609A] outline-none focus:border-[#F4ED36] shadow-[2px_2px_0px_#1A1A1A]"
          />
        </form>

        {/* Desktop Nav Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/search"
            className="btn-pill btn-pill-white text-xs font-mono py-1.5 px-3 flex items-center gap-1.5"
          >
            Explore
          </Link>

          {user ? (
            <>
              <Link
                href="/favorites"
                className="p-2 bg-[#F9F5F2] border-2 border-[#1A1A1A] rounded-full hover:bg-[#F8C1BA] transition-colors shadow-[2px_2px_0px_#1A1A1A]"
                title="Favorites"
              >
                <Heart className="w-4 h-4 text-[#1A1A1A]" />
              </Link>

              <Link
                href="/messages"
                className="p-2 bg-[#F9F5F2] border-2 border-[#1A1A1A] rounded-full hover:bg-[#F4ED36] transition-colors shadow-[2px_2px_0px_#1A1A1A]"
                title="Messages"
              >
                <MessageSquare className="w-4 h-4 text-[#1A1A1A]" />
              </Link>

              <Link
                href="/requests"
                className="p-2 bg-[#F9F5F2] border-2 border-[#1A1A1A] rounded-full hover:bg-[#B5C995] transition-colors shadow-[2px_2px_0px_#1A1A1A]"
                title="Purchase Requests"
              >
                <ShoppingBag className="w-4 h-4 text-[#1A1A1A]" />
              </Link>

              <Link
                href="/listings/create"
                className="btn-pill btn-pill-yellow text-xs py-1.5 px-3.5 flex items-center gap-1.5 font-bold"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Sell Item</span>
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 bg-[#F9F5F2] border-2 border-[#1A1A1A] rounded-full px-2.5 py-1 text-xs font-bold shadow-[2px_2px_0px_#1A1A1A] hover:bg-[#F9CC73] transition-colors"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username}
                      className="w-5 h-5 rounded-full border border-[#1A1A1A] object-cover"
                    />
                  ) : (
                    <UserIcon className="w-4 h-4 text-[#1A1A1A]" />
                  )}
                  <span className="font-mono text-[#1A1A1A]">
                    {profile?.username || user.email?.split('@')[0]}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-[#F9F5F2] border-2 border-[#1A1A1A] rounded-[6px] shadow-[4px_4px_0px_#1A1A1A] py-1 z-50"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b-2 border-[#1A1A1A] bg-[#F4ED36]/30">
                      <p className="font-bold text-xs text-[#1A1A1A] truncate">{profile?.full_name || profile?.username}</p>
                      <p className="font-mono text-[10px] text-[#61609A] truncate">{user.email}</p>
                    </div>

                    <Link
                      href="/seller"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#1A1A1A] hover:bg-[#F9CC73] transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      Seller Dashboard
                    </Link>

                    <Link
                      href="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#1A1A1A] hover:bg-[#F9CC73] transition-colors"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      My Profile
                    </Link>

                    <button
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        await signOut();
                        router.push('/');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#C94245] hover:bg-[#F8C1BA] transition-colors text-left border-t border-[#1A1A1A]"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="btn-pill btn-pill-white text-xs py-1.5 px-3 font-mono"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="btn-pill btn-pill-yellow text-xs py-1.5 px-3 font-mono font-bold"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 bg-[#F9F5F2] border-2 border-[#1A1A1A] rounded-[6px] shadow-[2px_2px_0px_#1A1A1A]"
        >
          {mobileMenuOpen ? <X className="w-5 h-5 text-[#1A1A1A]" /> : <Menu className="w-5 h-5 text-[#1A1A1A]" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t-2 border-[#1A1A1A] bg-[#61609A] p-4 rounded-[6px] text-[#F9F5F2] space-y-3">
          <form onSubmit={handleSearch} className="flex items-center relative">
            <Search className="absolute left-3 w-3.5 h-3.5 text-[#1A1A1A] pointer-events-none z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full bg-[#F9F5F2] border-2 border-[#1A1A1A] rounded-full py-2 !pl-9 !pr-4 text-xs text-[#1A1A1A]"
            />
          </form>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Link
              href="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-pill btn-pill-white text-xs py-2 text-center"
            >
              Explore
            </Link>
            <Link
              href="/listings/create"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-pill btn-pill-yellow text-xs py-2 text-center"
            >
              + Sell Item
            </Link>
          </div>

          {user ? (
            <div className="space-y-2 pt-2 border-t border-[#8584BD]">
              <Link
                href="/seller"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-bold text-[#F4ED36]"
              >
                Dashboard
              </Link>
              <Link
                href="/requests"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-bold text-[#F9F5F2]"
              >
                Purchase Requests
              </Link>
              <Link
                href="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-bold text-[#F9F5F2]"
              >
                Messages
              </Link>
              <Link
                href="/favorites"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-bold text-[#F9F5F2]"
              >
                Favorites
              </Link>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-bold text-[#F9F5F2]"
              >
                My Profile
              </Link>
              <button
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await signOut();
                  router.push('/');
                }}
                className="text-sm font-bold text-[#F8C1BA] pt-2"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-pill btn-pill-white text-xs py-2 text-center"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-pill btn-pill-yellow text-xs py-2 text-center"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
