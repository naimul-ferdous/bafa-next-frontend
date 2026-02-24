"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { AtwResultApprovalAuthority } from "@/libs/types/atwApproval";

interface AtwApprovalModalContextType {
  isOpen: boolean;
  editingAuthority: AtwResultApprovalAuthority | null;
  openModal: (authority?: AtwResultApprovalAuthority) => void;
  closeModal: () => void;
}

const AtwApprovalModalContext = createContext<AtwApprovalModalContextType | undefined>(undefined);

export function AtwApprovalModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingAuthority, setEditingAuthority] = useState<AtwResultApprovalAuthority | null>(null);

  const openModal = (authority?: AtwResultApprovalAuthority) => {
    setEditingAuthority(authority || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingAuthority(null);
  };

  return (
    <AtwApprovalModalContext.Provider value={{ isOpen, editingAuthority, openModal, closeModal }}>
      {children}
    </AtwApprovalModalContext.Provider>
  );
}

export function useAtwApprovalModal() {
  const context = useContext(AtwApprovalModalContext);
  if (context === undefined) {
    throw new Error("useAtwApprovalModal must be used within an AtwApprovalModalProvider");
  }
  return context;
}
