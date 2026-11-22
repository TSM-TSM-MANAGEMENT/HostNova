import { CheckCircle2, Clock, PauseCircle, XCircle, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const rawNormalized = status.toUpperCase();
  const normalized = rawNormalized === 'DEMO PAID' ? 'PAID' : rawNormalized;

  if (
    normalized === 'ACTIVE' ||
    normalized === 'CONFIRMED' ||
    normalized === 'SUCCESS' ||
    normalized === 'PAID'
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{normalized}</span>
      </span>
    );
  }

  if (normalized === 'SUSPENDED' || normalized === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 whitespace-nowrap">
        {normalized === 'SUSPENDED' ? (
          <PauseCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        ) : (
          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        )}
        <span>{normalized}</span>
      </span>
    );
  }

  if (normalized === 'CANCELLED' || normalized === 'FAILED') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400 whitespace-nowrap">
        <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{normalized}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 whitespace-nowrap">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{normalized}</span>
    </span>
  );
}
