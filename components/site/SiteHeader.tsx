"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
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
  const [menuPathname, setMenuPathname] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const mobileAccountRef = useRef<HTMLDivElement>(null);
  const desktopAccountRef = useRef<HTMLDivElement>(null);
  const menuVisible = menuOpen && menuPathname === pathname;

  useEffect(() => {
    if (!menuVisible) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuVisible]);

  useEffect(() => {
    if (!accountOpen) return;
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !mobileAccountRef.current?.contains(target) &&
        !desktopAccountRef.current?.contains(target)
      ) {
        setAccountOpen(false);
      }
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

  function renderAccountControl(ref: RefObject<HTMLDivElement | null>) {
    return (
      <div className="lcc-account" ref={ref}>
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
    );
  }

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
            aria-expanded={menuVisible}
            aria-controls={MOBILE_NAV_ID}
            aria-label={menuVisible ? "Close primary navigation" : "Open primary navigation"}
            onClick={() => {
              setMenuPathname(pathname);
              setMenuOpen(!menuVisible);
            }}
          >
            {menuVisible ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>

          <div className="lcc-site-header__mobile-account">
            {renderAccountControl(mobileAccountRef)}
          </div>
        </div>

        <div className="lcc-site-header__desktop-actions">
          <nav
            id={MOBILE_NAV_ID}
            className={`lcc-primary-nav${menuVisible ? " is-open" : ""}`}
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
          <div className="lcc-site-header__desktop-account">
            {renderAccountControl(desktopAccountRef)}
          </div>
        </div>
      </div>
    </header>
  );
}
