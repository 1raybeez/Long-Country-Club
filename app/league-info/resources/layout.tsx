import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resources | Long Country Club FFL',
  description: 'League references, LCC tools, and approved fantasy football research resources.',
};

export default function ResourcesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
