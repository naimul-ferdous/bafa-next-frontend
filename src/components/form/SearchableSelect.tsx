"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";

interface SearchableSelectOption {
  value: string;
  label: string;
  className?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  disabled = false,
  required = false,
  className = "",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label || "";

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const updateDropdownPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    updateDropdownPosition();
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    const handleScroll = () => updateDropdownPosition();
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, updateDropdownPosition]);

  const dropdown = isOpen ? (
    <div
      style={dropdownStyle}
      className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden"
    >
      <div className="p-2 border-b border-gray-100">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>
      <div className="overflow-y-auto max-h-48">
        {filtered.map((option) => (
          <div
            key={option.value}
            onMouseDown={(e) => {
              e.preventDefault();
              onChange(option.value);
              setIsOpen(false);
              setSearch("");
            }}
            className={`px-3 py-2 text-sm cursor-pointer ${
              value === option.value
                ? "bg-blue-50 text-blue-700"
                : `hover:bg-gray-50 ${option.className || "text-gray-900"}`
            }`}
          >
            {option.label}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="px-3 py-2 text-sm text-gray-400 text-center">
            No results found
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div ref={triggerRef} className={`relative ${className}`}>
      {required && (
        <input
          type="text"
          value={value}
          required
          tabIndex={-1}
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
          onChange={() => {}}
        />
      )}
      <div
        onClick={handleOpen}
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer flex items-center justify-between ${
          disabled ? "opacity-50 cursor-not-allowed bg-gray-100" : ""
        }`}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {selectedLabel || placeholder}
        </span>
        <Icon
          icon={isOpen ? "hugeicons:arrow-up-01" : "hugeicons:arrow-down-01"}
          className="w-4 h-4 text-gray-400"
        />
      </div>
      {typeof window !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
}
