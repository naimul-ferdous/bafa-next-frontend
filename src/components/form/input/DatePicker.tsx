"use client";

import React, { useEffect, useRef, useId } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

interface DatePickerProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  min?: string;
  max?: string;
  id?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "dd/mm/yyyy",
  required,
  disabled,
  className,
  min,
  max,
  id,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const flatpickrInstance = useRef<flatpickr.Instance | null>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const uniqueId = useId();
  const inputId = id || uniqueId;

  // Keep refs updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (inputRef.current && !flatpickrInstance.current) {
      // Initialize flatpickr only once
      flatpickrInstance.current = flatpickr(inputRef.current, {
        dateFormat: "d/m/Y",
        allowInput: true,
        minDate: min,
        maxDate: max,
        onChange: (selectedDates, dateStr) => {
          if (onChangeRef.current) {
            const syntheticEvent = {
              target: {
                value: dateStr,
              },
            } as React.ChangeEvent<HTMLInputElement>;
            onChangeRef.current(syntheticEvent);
          }
        },
      });

      // Set initial value
      if (valueRef.current) {
        flatpickrInstance.current.setDate(valueRef.current, false);
      }
    }

    // Cleanup
    return () => {
      if (flatpickrInstance.current) {
        flatpickrInstance.current.destroy();
        flatpickrInstance.current = null;
      }
    };
  }, [min, max]);

  // Update value when prop changes - only if different from current display
  useEffect(() => {
    if (flatpickrInstance.current) {
      const currentDate = flatpickrInstance.current.selectedDates[0];
      const currentDisplayValue = currentDate ? flatpickrInstance.current.formatDate(currentDate, "d/m/Y") : "";

      // Only update if the prop value is different from what's displayed
      if (value !== currentDisplayValue) {
        if (value) {
          flatpickrInstance.current.setDate(value, false);
        } else {
          flatpickrInstance.current.clear();
        }
      }
    }
  }, [value]);

  // Update disabled state
  useEffect(() => {
    if (flatpickrInstance.current && inputRef.current) {
      if (disabled) {
        flatpickrInstance.current.set("clickOpens", false);
        inputRef.current.disabled = true;
      } else {
        flatpickrInstance.current.set("clickOpens", true);
        inputRef.current.disabled = false;
      }
    }
  }, [disabled]);

  return (
    <input
      ref={inputRef}
      id={inputId}
      type="text"
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={
        className ||
        "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      }
      readOnly
    />
  );
};

export default DatePicker;
