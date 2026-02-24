"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { Aircraft } from "@/libs/types/aircraft";

interface AircraftModalContextType {
  isOpen: boolean;
  editingAircraft: Aircraft | null;
  openModal: (aircraft?: Aircraft) => void;
  closeModal: () => void;
}

const AircraftModalContext = createContext<AircraftModalContextType | undefined>(undefined);

export function AircraftModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingAircraft, setEditingAircraft] = useState<Aircraft | null>(null);

  const openModal = (aircraft?: Aircraft) => {
    setEditingAircraft(aircraft || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setEditingAircraft(null), 300);
  };

  return (
    <AircraftModalContext.Provider value={{ isOpen, editingAircraft, openModal, closeModal }}>
      {children}
    </AircraftModalContext.Provider>
  );
}

export function useAircraftModal() {
  const context = useContext(AircraftModalContext);
  if (context === undefined) {
    throw new Error("useAircraftModal must be used within an AircraftModalProvider");
  }
  return context;
}
