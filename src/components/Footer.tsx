'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto bg-[#61609A] border-t-2 border-[#1A1A1A] py-10 px-4 lg:px-8 text-[#F9F5F2]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="inline-block bg-[#F4ED36] border-2 border-[#1A1A1A] px-3 py-1 rounded-[6px] shadow-[2px_2px_0px_#1A1A1A]">
            <span className="font-['Archivo_Black',sans-serif] text-lg text-[#1A1A1A] uppercase">
              ReUse<span className="text-[#C94245]">Hub</span>
            </span>
          </div>
          <p className="font-mono text-xs text-[#F9F5F2]/80 leading-relaxed">
            The community marketplace for reclaimed materials, surplus stock, and architectural salvage.
          </p>
          <div className="inline-flex items-center gap-2 bg-[#B5C995] text-[#1A1A1A] px-3 py-1 rounded-full border-2 border-[#1A1A1A] text-xs font-mono font-bold">
            🌱 100% Circular Intent
          </div>
        </div>

        <div>
          <h4 className="font-['Archivo_Black',sans-serif] text-sm text-[#F4ED36] uppercase mb-3">
            Explore Categories
          </h4>
          <ul className="space-y-1.5 font-mono text-xs">
            <li><Link href="/search?category=Wood" className="hover:text-[#F4ED36] transition-colors">Reclaimed Wood</Link></li>
            <li><Link href="/search?category=Metal" className="hover:text-[#F4ED36] transition-colors">Surplus Metals</Link></li>
            <li><Link href="/search?category=Fabric" className="hover:text-[#F4ED36] transition-colors">Textiles & Fabrics</Link></li>
            <li><Link href="/search?category=Furniture" className="hover:text-[#F4ED36] transition-colors">Vintage Furniture</Link></li>
            <li><Link href="/search?category=Construction" className="hover:text-[#F4ED36] transition-colors">Construction Salvage</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-['Archivo_Black',sans-serif] text-sm text-[#F4ED36] uppercase mb-3">
            Marketplace
          </h4>
          <ul className="space-y-1.5 font-mono text-xs">
            <li><Link href="/listings/create" className="hover:text-[#F4ED36] transition-colors">Sell an Item</Link></li>
            <li><Link href="/requests" className="hover:text-[#F4ED36] transition-colors">Purchase Requests</Link></li>
            <li><Link href="/seller" className="hover:text-[#F4ED36] transition-colors">Seller Dashboard</Link></li>
            <li><Link href="/favorites" className="hover:text-[#F4ED36] transition-colors">Saved Favorites</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-['Archivo_Black',sans-serif] text-sm text-[#F4ED36] uppercase mb-3">
            Community
          </h4>
          <p className="font-mono text-xs text-[#F9F5F2]/80 leading-relaxed mb-3">
            Connect directly with makers, carpenters, and circular builders across the country.
          </p>
          <div className="inline-block bg-[#1A1A1A] border border-[#F4ED36] px-3 py-1.5 rounded-[6px] font-mono text-[11px] text-[#F9CC73]">
            🌱 Local Salvage Network
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-4 border-t border-[#8584BD] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-[#F9F5F2]/60">
        <p>© 2026 ReUseHub. All rights reserved.</p>
        <p>Circular Economy Marketplace</p>
      </div>
    </footer>
  );
}
