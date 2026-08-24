import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site/SiteHeader";
import { OwnerFeedbackFooter } from "@/components/site/OwnerFeedbackFooter";
import { getCurrentMemberSession } from "@/lib/auth/session";
import { LCC_BRAND } from "@/lib/lccBrand";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Long Country Club FFL",
  description: "Official LCC Dynasty Clubhouse",
  icons: {
    icon: LCC_BRAND.assets.appIcon,
    apple: LCC_BRAND.assets.appIcon,
  },
  openGraph: {
    title: "Long Country Club FFL",
    description: "Official LCC Dynasty Clubhouse",
    images: [
      {
        url: LCC_BRAND.assets.social,
        alt: "Long Country Club",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Long Country Club FFL",
    description: "Official LCC Dynasty Clubhouse",
    images: [LCC_BRAND.assets.social],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentMemberSession();

  return (
    <html lang="en">
      <body className="lcc-app-body">
        <SiteHeader session={session ? { authenticated: true, member: session.member } : null} />
        {children}
        <OwnerFeedbackFooter member={session?.member ?? null} />
      </body>
    </html>
  );
}
