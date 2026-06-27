import type { Metadata } from "next";
import "./globals.css";
import Image from "next/image";
import Link from "next/link";
import { LCC_PRIMARY_NAV_ROUTES } from "@/lib/routeConfig";

export const metadata: Metadata = {
  title: "Long Country Club FFL",
  description: "Official LCC Dynasty Clubhouse",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="lcc-app-body">
        <header className="lcc-site-header">
          <div className="lcc-site-header__inner">
            <Link href="/" className="lcc-site-brand">
              <div className="lcc-site-brand__mark">
                <Image
                  src="/logos/long-country-club-ffl.png"
                  alt="LCC Logo"
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
              <div>
                <h1 className="lcc-site-brand__title">
                  Long Country Club{" "}
                  <span className="lcc-site-brand__accent">FFL</span>
                </h1>
                <p className="lcc-site-brand__meta">Established 2003</p>
              </div>
            </Link>

            <nav className="lcc-primary-nav" aria-label="Primary navigation">
              {LCC_PRIMARY_NAV_ROUTES.map((route) => (
                <Link
                  key={route.id}
                  href={route.href}
                  className="lcc-primary-nav__link"
                >
                  {route.navLabel || route.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
