"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { SystemWarningType } from "@/libs/types/system";

interface WarningTypeModalContextType {
  isOpen: boolean;
  editingWarningType: SystemWarningType | null;
  openModal: (warningType?: SystemWarningType) => void;
  closeModal: () => void;
}

const WarningTypeModalContext = createContext<WarningTypeModalContextType | undefined>(undefined);

export function WarningTypeModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingWarningType, setEditingWarningType] = useState<SystemWarningType | null>(null);

  const openModal = (warningType?: SystemWarningType) => {
    setEditingWarningType(warningType || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setEditingWarningType(null), 300);
  };

  return (
    <WarningTypeModalContext.Provider value={{ isOpen, editingWarningType, openModal, closeModal }}>
      {children}
    </WarningTypeModalContext.Provider>
  );
}

export function useWarningTypeModal() {
  const context = useContext(WarningTypeModalContext);
  if (context === undefined) {
    throw new Error("useWarningTypeModal must be used within a WarningTypeModalProvider");
  }
  return context;
}
