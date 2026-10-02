'use client';

import { useEffect, useState } from 'react';

import { ApiError, createBooking } from '@/lib/api';
import type { Booking, Diagnosis } from '@/lib/types';

// Local date se YYYY-MM-DD banao — toISOString() UTC deta hai, late-night
// IST pe "kal" ki date ek din peeche ho jati.
function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

// Backend serializer ka regex mirror — validate wahi hai, message bhi wahi.
const PHONE_RE = /^\+?[0-9][0-9\s\-]{6,19}$/;

const INPUT_CLASS =
  'w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500';

interface BookingModalProps {
  diagnosis: Diagnosis;
  onClose: () => void;
  onBooked: (booking: Booking) => void;
}

export default function BookingModal({
  diagnosis,
  onClose,
  onBooked,
}: BookingModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = todayIso();

  // Escape se close — lekin submit ke beech nahi (request ja chuki hoti hai).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [submitting, onClose]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    // Client-side checks — messages BACKEND ke wording se match karte hain,
    // taaki user ko dono taraf se same baat dikhe.
    if (!trimmedName) {
      setError('Please enter your name.');
      return;
    }
    if (trimmedName.length > 100) {
      setError('Name is too long (max 100 characters).');
      return;
    }
    if (!trimmedPhone) {
      setError('Please enter your phone number.');
      return;
    }
    if (!PHONE_RE.test(trimmedPhone)) {
      setError('Enter a valid phone number.');
      return;
    }
    if (!date) {
      setError('Please choose a preferred date.');
      return;
    }
    if (date < today) {
      setError('Preferred date cannot be in the past.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const response = await createBooking({
        diagnosis_id: diagnosis.id,
        customer_name: trimmedName,
        phone: trimmedPhone,
        preferred_date: date,
      });
      onBooked(response.booking); // parent modal unmount kar dega
    } catch (err) {
      // Yahan setSubmitting(false) chahiye — success pe modal unmount hota
      // hai, isliye sirf error path pe re-enable karna hai.
      setError(
        err instanceof ApiError
          ? err.message
          : 'Booking failed. Please try again.',
      );
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Book a mechanic"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Book a mechanic
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {diagnosis.likely_issue} · Service: {diagnosis.recommended_service}
        </p>

        {/* noValidate: browser ki native tooltip ki jagah hamare messages
            dikhein (backend wording se match karte hain). */}
        <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Your name
            </span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              autoFocus
              placeholder="Rahul Sharma"
              className={INPUT_CLASS}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Phone number
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              maxLength={20}
              placeholder="+91 98765 43210"
              className={INPUT_CLASS}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Preferred date
            </span>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(event) => setDate(event.target.value)}
              className={INPUT_CLASS}
            />
          </label>

          {error && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Booking…' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
