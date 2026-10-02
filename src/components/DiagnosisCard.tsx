import type { Booking, Confidence, Diagnosis } from '@/lib/types';

const CONFIDENCE_STYLES: Record<Confidence, string> = {
  low: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  high: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
};

const PROVENANCE_LABELS: Record<Diagnosis['generated_by'], string> = {
  rule_engine: 'Rule engine',
  gemini: 'Gemini assist',
};

interface DiagnosisCardProps {
  diagnosis: Diagnosis;
  // Sirf tab set hota hai jab is diagnosis ke liye booking ho chuki ho.
  booking: Booking | null;
  onBook: () => void;
}

export default function DiagnosisCard({
  diagnosis,
  booking,
  onBook,
}: DiagnosisCardProps) {
  const bookingForThisDiagnosis =
    booking && booking.diagnosis_id === diagnosis.id ? booking : null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Diagnosis
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CONFIDENCE_STYLES[diagnosis.confidence]}`}
        >
          {diagnosis.confidence} confidence
        </span>
        <span className="ml-auto text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          {PROVENANCE_LABELS[diagnosis.generated_by]}
        </span>
      </div>

      <h2 className="mt-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        {diagnosis.likely_issue}
      </h2>

      <p
        className={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold ${
          diagnosis.can_drive
            ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
        }`}
      >
        {diagnosis.can_drive
          ? 'Can drive for now (with care)'
          : 'Avoid driving until checked'}
      </p>

      <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        {diagnosis.reasoning}
      </p>

      <div className="mt-4 rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800/60">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Next step
        </span>
        <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
          {diagnosis.next_step}
        </p>
      </div>

      <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 dark:border-blue-900/50 dark:bg-blue-950/40">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 dark:text-blue-400">
          Recommended service
        </span>
        <p className="mt-0.5 text-sm font-medium text-blue-900 dark:text-blue-200">
          {diagnosis.recommended_service}
        </p>

        {bookingForThisDiagnosis ? (
          <p className="mt-3 rounded-lg bg-green-100 px-3 py-2 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300">
            Booked — {bookingForThisDiagnosis.booking_ref}
          </p>
        ) : (
          <button
            type="button"
            onClick={onBook}
            className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Book Mechanic
          </button>
        )}
      </div>
    </div>
  );
}
