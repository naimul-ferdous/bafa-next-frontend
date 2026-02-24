"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { SubWing } from "@/libs/types/user";

interface SubWingModalContextType {
  isOpen: boolean;
  editingSubWing: SubWing | null;
  openModal: (subWing?: SubWing) => void;
  closeModal: () => void;
}

const SubWingModalContext = createContext<SubWingModalContextType | undefined>(undefined);

export function SubWingModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingSubWing, setEditingSubWing] = useState<SubWing | null>(null);

  const openModal = (subWing?: SubWing) => {
    setEditingSubWing(subWing || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setEditingSubWing(null), 300);
  };

  return (
    <SubWingModalContext.Provider value={{ isOpen, editingSubWing, openModal, closeModal }}>
      {children}
    </SubWingModalContext.Provider>
  );
}

export function useSubWingModal() {
  const context = useContext(SubWingModalContext);
  if (context === undefined) {
    throw new Error("useSubWingModal must be used within a SubWingModalProvider");
  }
  return context;
}
