'use client';

import type { Booking, BookingStatus } from '@/lib/types';

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending confirmation',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  completed: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

// '2026-10-05' ko 'Mon, 5 Oct 2026' banao. new Date(string) UTC midnight
// maanta hai — isliye parts todkar local date banao.
function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface BookingCardProps {
  booking: Booking;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function BookingCard({
  booking,
  onRefresh,
  isRefreshing,
}: BookingCardProps) {
  return (
    <div className="rounded-2xl border border-green-200 bg-green-50/60 p-4 shadow-sm sm:p-5 dark:border-green-900/50 dark:bg-green-950/20">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
          Booking
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[booking.status]}`}
        >
          {STATUS_LABELS[booking.status]}
        </span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="ml-auto shrink-0 text-xs font-medium text-green-700 hover:underline disabled:cursor-not-allowed disabled:opacity-40 dark:text-green-400"
        >
          {isRefreshing ? 'Checking…' : 'Refresh status'}
        </button>
      </div>

      <p className="mt-2 font-mono text-lg font-semibold tracking-wide text-green-900 dark:text-green-200">
        {booking.booking_ref}
      </p>

      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-zinc-500 dark:text-zinc-400">Service for</dt>
        <dd className="font-medium text-zinc-800 dark:text-zinc-200">
          {booking.likely_issue}
        </dd>
        <dt className="text-zinc-500 dark:text-zinc-400">Preferred date</dt>
        <dd className="font-medium text-zinc-800 dark:text-zinc-200">
          {formatDate(booking.preferred_date)}
        </dd>
        <dt className="text-zinc-500 dark:text-zinc-400">Name</dt>
        <dd className="font-medium text-zinc-800 dark:text-zinc-200">
          {booking.customer_name}
        </dd>
        <dt className="text-zinc-500 dark:text-zinc-400">Phone</dt>
        <dd className="font-medium text-zinc-800 dark:text-zinc-200">
          {booking.phone}
        </dd>
      </dl>

      <p className="mt-3 text-[11px] text-green-700/80 dark:text-green-400/80">
        Booking ID #{booking.id} — save this reference to check status anytime.
      </p>
    </div>
  );
}
