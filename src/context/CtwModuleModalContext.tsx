"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { CtwResultsModule } from "@/libs/types/ctw";

interface CtwModuleModalContextType {
  isOpen: boolean;
  editingModule: CtwResultsModule | null;
  openModal: (module?: CtwResultsModule) => void;
  closeModal: () => void;
}

const CtwModuleModalContext = createContext<CtwModuleModalContextType | undefined>(undefined);

export function CtwModuleModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CtwResultsModule | null>(null);

  const openModal = (module?: CtwResultsModule) => {
    setEditingModule(module || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setEditingModule(null), 300);
  };

  return (
    <CtwModuleModalContext.Provider value={{ isOpen, editingModule, openModal, closeModal }}>
      {children}
    </CtwModuleModalContext.Provider>
  );
}

export function useCtwModuleModal() {
  const context = useContext(CtwModuleModalContext);
  if (context === undefined) {
    throw new Error("useCtwModuleModal must be used within a CtwModuleModalProvider");
  }
  return context;
}
