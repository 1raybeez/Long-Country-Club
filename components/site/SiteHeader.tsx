"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LCC_PRIMARY_NAV_ROUTES } from "@/lib/routeConfig";
import { LCC_BRAND } from "@/lib/lccBrand";
import { GoogleAuthButton } from "./GoogleAuthButton";
import type { LccMemberIdentity } from "@/lib/auth/types";

type SiteHeaderSession = {
  readonly authenticated: true;
  readonly member: LccMemberIdentity | null;
};

const MOBILE_NAV_ID = "lcc-primary-navigation";

function isRouteActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ session }: { session: SiteHeaderSession | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!accountOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountOpen]);

  return (
    <header className="lcc-site-header">
      <div className="lcc-site-header__inner">
        <div className="lcc-site-header__bar">
          <Link href="/" className="lcc-site-brand" aria-label="LCC home">
            <div className="lcc-site-brand__mark">
              <Image
                src={LCC_BRAND.assets.headerBadge}
                alt=""
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>
            <div>
              <p className="lcc-site-brand__title">
                Long Country Club <span className="lcc-site-brand__accent">FFL</span>
              </p>
              <p className="lcc-site-brand__meta">Est. 2003 · Dynasty Football</p>
            </div>
          </Link>

          <button
            type="button"
            className="lcc-mobile-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls={MOBILE_NAV_ID}
            aria-label={menuOpen ? "Close primary navigation" : "Open primary navigation"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>

          <div className="lcc-account" ref={accountRef}>
            {session ? (
              <>
                <button
                  type="button"
                  className="lcc-account__trigger"
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  onClick={() => setAccountOpen((open) => !open)}
                >
                  <span className="lcc-account__identity">
                    <strong>{session.member?.displayName ?? "Authenticated member"}</strong>
                    <small>{session.member?.teamName ?? "Member access not configured"}</small>
                  </span>
                  <span aria-hidden="true">▾</span>
                </button>
                {accountOpen ? (
                  <div className="lcc-account__menu" role="menu" aria-label="Account menu">
                    {session.member?.capabilities.includes("war-room") ? (
                      <Link href="/war-room" role="menuitem" onClick={() => setAccountOpen(false)}>
                        My War Room
                      </Link>
                    ) : null}
                    {session.member?.capabilities.includes("commissioner") ? (
                      <Link href="/commish" role="menuitem" onClick={() => setAccountOpen(false)}>
                        Commissioner Hub
                      </Link>
                    ) : null}
                    <GoogleAuthButton
                      mode="sign-out"
                      className="lcc-account__menu-action"
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <GoogleAuthButton
                mode="sign-in"
                returnTo={pathname}
                className="lcc-account__sign-in"
              />
            )}
          </div>
        </div>

        <nav
          id={MOBILE_NAV_ID}
          className={`lcc-primary-nav${menuOpen ? " is-open" : ""}`}
          aria-label="Primary navigation"
        >
          {LCC_PRIMARY_NAV_ROUTES.map((route) => {
            const active = isRouteActive(pathname, route.href);

            return (
              <Link
                key={route.id}
                href={route.href}
                aria-current={active ? "page" : undefined}
                className={`lcc-primary-nav__link${active ? " is-active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                {route.navLabel || route.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
