"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { SystemSemester } from "@/libs/types/system";

interface SemesterModalContextType {
  isOpen: boolean;
  editingSemester: SystemSemester | null;
  openModal: (semester?: SystemSemester) => void;
  closeModal: () => void;
}

const SemesterModalContext = createContext<SemesterModalContextType | undefined>(undefined);

export function SemesterModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<SystemSemester | null>(null);

  const openModal = (semester?: SystemSemester) => {
    setEditingSemester(semester || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setEditingSemester(null), 300);
  };

  return (
    <SemesterModalContext.Provider value={{ isOpen, editingSemester, openModal, closeModal }}>
      {children}
    </SemesterModalContext.Provider>
  );
}

export function useSemesterModal() {
  const context = useContext(SemesterModalContext);
  if (context === undefined) {
    throw new Error("useSemesterModal must be used within a SemesterModalProvider");
  }
  return context;
}
