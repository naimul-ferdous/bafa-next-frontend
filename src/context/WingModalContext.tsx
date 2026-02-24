"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { Wing } from "@/libs/types/user";

interface WingModalContextType {
  isOpen: boolean;
  editingWing: Wing | null;
  openModal: (wing?: Wing) => void;
  closeModal: () => void;
}

const WingModalContext = createContext<WingModalContextType | undefined>(undefined);

export function WingModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingWing, setEditingWing] = useState<Wing | null>(null);

  const openModal = (wing?: Wing) => {
    setEditingWing(wing || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setEditingWing(null), 300);
  };

  return (
    <WingModalContext.Provider value={{ isOpen, editingWing, openModal, closeModal }}>
      {children}
    </WingModalContext.Provider>
  );
}

export function useWingModal() {
  const context = useContext(WingModalContext);
  if (context === undefined) {
    throw new Error("useWingModal must be used within a WingModalProvider");
  }
  return context;
}
