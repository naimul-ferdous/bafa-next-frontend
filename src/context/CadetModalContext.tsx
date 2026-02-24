"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { CadetProfile } from "@/libs/types/user";

interface CadetModalContextType {
  isOpen: boolean;
  editingCadet: CadetProfile | null;
  openModal: (cadet?: CadetProfile) => void;
  closeModal: () => void;
}

const CadetModalContext = createContext<CadetModalContextType | undefined>(undefined);

export function CadetModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCadet, setEditingCadet] = useState<CadetProfile | null>(null);

  const openModal = (cadet?: CadetProfile) => {
    setEditingCadet(cadet || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setEditingCadet(null), 300);
  };

  return (
    <CadetModalContext.Provider value={{ isOpen, editingCadet, openModal, closeModal }}>
      {children}
    </CadetModalContext.Provider>
  );
}

export function useCadetModal() {
  const context = useContext(CadetModalContext);
  if (context === undefined) {
    throw new Error("useCadetModal must be used within a CadetModalProvider");
  }
  return context;
}
