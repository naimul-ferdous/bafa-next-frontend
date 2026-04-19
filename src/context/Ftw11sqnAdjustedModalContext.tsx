"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { Ftw11sqnResultsBupAdjustMarkGrading } from "@/libs/services/ftw11sqnResultsBupAdjustMarkGradingService";

interface Ftw11sqnAdjustedModalContextType {
  isOpen: boolean;
  editingRecord: Ftw11sqnResultsBupAdjustMarkGrading | null;
  openModal: (record?: Ftw11sqnResultsBupAdjustMarkGrading) => void;
  closeModal: () => void;
}

const Ftw11sqnAdjustedModalContext = createContext<Ftw11sqnAdjustedModalContextType | undefined>(undefined);

export function Ftw11sqnAdjustedModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Ftw11sqnResultsBupAdjustMarkGrading | null>(null);

  const openModal = (record?: Ftw11sqnResultsBupAdjustMarkGrading) => {
    setEditingRecord(record || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setEditingRecord(null), 300);
  };

  return (
    <Ftw11sqnAdjustedModalContext.Provider value={{ isOpen, editingRecord, openModal, closeModal }}>
      {children}
    </Ftw11sqnAdjustedModalContext.Provider>
  );
}

export function useFtw11sqnAdjustedModal() {
  const context = useContext(Ftw11sqnAdjustedModalContext);
  if (context === undefined) {
    throw new Error("useFtw11sqnAdjustedModal must be used within a Ftw11sqnAdjustedModalProvider");
  }
  return context;
}
