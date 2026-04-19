"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { Ftw12sqnResultsBupAdjustMarkGrading } from "@/libs/services/ftw12sqnResultsBupAdjustMarkGradingService";

interface Ftw12sqnAdjustedModalContextType {
  isOpen: boolean;
  editingRecord: Ftw12sqnResultsBupAdjustMarkGrading | null;
  openModal: (record?: Ftw12sqnResultsBupAdjustMarkGrading) => void;
  closeModal: () => void;
}

const Ftw12sqnAdjustedModalContext = createContext<Ftw12sqnAdjustedModalContextType | undefined>(undefined);

export function Ftw12sqnAdjustedModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Ftw12sqnResultsBupAdjustMarkGrading | null>(null);

  const openModal = (record?: Ftw12sqnResultsBupAdjustMarkGrading) => {
    setEditingRecord(record || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setEditingRecord(null), 300);
  };

  return (
    <Ftw12sqnAdjustedModalContext.Provider value={{ isOpen, editingRecord, openModal, closeModal }}>
      {children}
    </Ftw12sqnAdjustedModalContext.Provider>
  );
}

export function useFtw12sqnAdjustedModal() {
  const context = useContext(Ftw12sqnAdjustedModalContext);
  if (context === undefined) {
    throw new Error("useFtw12sqnAdjustedModal must be used within a Ftw12sqnAdjustedModalProvider");
  }
  return context;
}
