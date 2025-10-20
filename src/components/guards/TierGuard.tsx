import React from 'react';
import { useTier, Tier } from '@/hooks/useTier';
import LoadingFallback from '@/components/LoadingFallback';

interface TierGuardProps {
  allow: Tier[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const TierGuard: React.FC<TierGuardProps> = ({ allow, fallback, children }) => {
  const { tier, loading } = useTier();

  if (loading) {
    return <LoadingFallback />;
  }

  if (allow.includes(tier)) {
    return <>{children}</>;
  }

  return (
    <>
      {fallback ?? (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <div className="max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">Upgrade Required</h2>
            <p className="text-muted-foreground mb-6">
              This feature is available for{' '}
              {allow.includes('pro') && 'Pro'}
              {allow.includes('degenerate') && ' & Degenerate'}
              {allow.includes('admin') && ' Admin'} users.
            </p>
            <button className="btn btn-primary">
              Upgrade Now
            </button>
          </div>
        </div>
      )}
    </>
  );
};
