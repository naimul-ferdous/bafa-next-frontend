"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { AircraftType } from "@/libs/types/aircraft";

interface AircraftTypeModalContextType {
  isOpen: boolean;
  editingAircraftType: AircraftType | null;
  openModal: (aircraftType?: AircraftType) => void;
  closeModal: () => void;
}

const AircraftTypeModalContext = createContext<AircraftTypeModalContextType | undefined>(undefined);

export function AircraftTypeModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingAircraftType, setEditingAircraftType] = useState<AircraftType | null>(null);

  const openModal = (aircraftType?: AircraftType) => {
    setEditingAircraftType(aircraftType || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setEditingAircraftType(null), 300);
  };

  return (
    <AircraftTypeModalContext.Provider value={{ isOpen, editingAircraftType, openModal, closeModal }}>
      {children}
    </AircraftTypeModalContext.Provider>
  );
}

export function useAircraftTypeModal() {
  const context = useContext(AircraftTypeModalContext);
  if (context === undefined) {
    throw new Error("useAircraftTypeModal must be used within an AircraftTypeModalProvider");
  }
  return context;
}
