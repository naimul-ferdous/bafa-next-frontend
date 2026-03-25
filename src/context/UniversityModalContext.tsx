"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { SystemUniversity } from "@/libs/types/system";

interface UniversityModalContextType {
  isOpen: boolean;
  editingUniversity: SystemUniversity | null;
  openModal: (university?: SystemUniversity) => void;
  closeModal: () => void;
}

const UniversityModalContext = createContext<UniversityModalContextType | undefined>(undefined);

export function UniversityModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState<SystemUniversity | null>(null);

  const openModal = (university?: SystemUniversity) => {
    setEditingUniversity(university || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setEditingUniversity(null), 300);
  };

  return (
    <UniversityModalContext.Provider value={{ isOpen, editingUniversity, openModal, closeModal }}>
      {children}
    </UniversityModalContext.Provider>
  );
}

export function useUniversityModal() {
  const context = useContext(UniversityModalContext);
  if (context === undefined) {
    throw new Error("useUniversityModal must be used within a UniversityModalProvider");
  }
  return context;
}
