"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { SystemProgram } from "@/libs/types/system";

interface ProgramModalContextType {
  isOpen: boolean;
  editingProgram: SystemProgram | null;
  openModal: (program?: SystemProgram) => void;
  closeModal: () => void;
}

const ProgramModalContext = createContext<ProgramModalContextType | undefined>(undefined);

export function ProgramModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<SystemProgram | null>(null);

  const openModal = (program?: SystemProgram) => {
    setEditingProgram(program || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setEditingProgram(null), 300);
  };

  return (
    <ProgramModalContext.Provider value={{ isOpen, editingProgram, openModal, closeModal }}>
      {children}
    </ProgramModalContext.Provider>
  );
}

export function useProgramModal() {
  const context = useContext(ProgramModalContext);
  if (context === undefined) {
    throw new Error("useProgramModal must be used within a ProgramModalProvider");
  }
  return context;
}
