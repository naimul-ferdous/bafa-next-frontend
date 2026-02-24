"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { SystemBranch } from "@/libs/types/system";

interface BranchModalContextType {
  isOpen: boolean;
  editingBranch: SystemBranch | null;
  openModal: (branch?: SystemBranch) => void;
  closeModal: () => void;
}

const BranchModalContext = createContext<BranchModalContextType | undefined>(undefined);

export function BranchModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<SystemBranch | null>(null);

  const openModal = (branch?: SystemBranch) => {
    setEditingBranch(branch || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setEditingBranch(null), 300);
  };

  return (
    <BranchModalContext.Provider value={{ isOpen, editingBranch, openModal, closeModal }}>
      {children}
    </BranchModalContext.Provider>
  );
}

export function useBranchModal() {
  const context = useContext(BranchModalContext);
  if (context === undefined) {
    throw new Error("useBranchModal must be used within a BranchModalProvider");
  }
  return context;
}
