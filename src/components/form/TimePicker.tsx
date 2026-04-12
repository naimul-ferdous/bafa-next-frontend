"use client";

import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import { Icon } from "@iconify/react";

type Props = {
  id: string;
  value?: string | null;
  onChange?: (time: string) => void;
  placeholder?: string;
};

export default function TimePicker({ id, value, onChange, placeholder = "HH:MM" }: Props) {
  const fpRef = useRef<flatpickr.Instance | null>(null);

  useEffect(() => {
    const input = document.getElementById(id) as HTMLInputElement;
    if (!input) return;

    fpRef.current = flatpickr(input, {
      enableTime: true,
      noCalendar: true,
      dateFormat: "H:i",
      time_24hr: true,
      defaultDate: value || undefined,
      onChange: (_, timeStr) => {
        onChange?.(timeStr);
      },
    });

    return () => {
      fpRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Sync external value changes
  useEffect(() => {
    if (fpRef.current) {
      if (value) {
        fpRef.current.setDate(value, false);
      } else {
        fpRef.current.clear();
      }
    }
  }, [value]);

  return (
    <div className="relative">
      <input
        id={id}
        placeholder={placeholder}
        readOnly
        className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 cursor-pointer"
      />
      <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
        <Icon icon="hugeicons:clock-01" className="w-5 h-5" />
      </span>
    </div>
  );
}
