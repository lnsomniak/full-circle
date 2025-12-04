'use client';

import dynamic from 'next/dynamic';

const DiamondGrid = dynamic(() => import('../components/DiamondGrid'), {
  ssr: false,
});

export default function LoadingPage() {
  return <DiamondGrid />;
}