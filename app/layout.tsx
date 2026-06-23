import type { Metadata } from "next";
import "./globals.css";
import Image from 'next/image';
import Link from 'next/link';
import { LCC_PRIMARY_NAV_ROUTES } from '@/lib/routeConfig';

export const metadata: Metadata = {
  title: "Long Country Club FFL",
  description: "Official LCC Dynasty Clubhouse",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#F9F7F2] text-[#1A472A]">
        {/* SHARED HEADER - THE ONLY NAV */}
        <div className="w-full flex flex-col items-center pt-8 pb-6 border-b border-black/5 bg-white sticky top-0 z-50 shadow-sm">
          <Link href="/" className="group flex flex-col items-center">
            <div className="relative w-24 h-24 mb-3 overflow-hidden rounded-full border-4 border-[#1A472A] shadow-xl">
              <Image 
                src="/Long Country Club FFL.png" 
                alt="LCC Logo" 
                fill 
                className="object-cover"
                priority
                unoptimized
              />
            </div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-[#1A472A]">
              Long Country Club <span className="text-[#C5A059]">FFL</span>
            </h1>
          </Link>
          
          <nav className="mt-6 flex justify-center gap-4">
            {LCC_PRIMARY_NAV_ROUTES.map((route) => (
              <Link key={route.id} href={route.href}>
                <button className="px-5 py-2 rounded-full border border-gray-200 text-[9px] font-black uppercase tracking-widest bg-white hover:bg-gray-50 transition-all">
                  {route.navLabel || route.label}
                </button>
              </Link>
            ))}
          </nav>
        </div>
        {children}
      </body>
    </html>
  );
}
