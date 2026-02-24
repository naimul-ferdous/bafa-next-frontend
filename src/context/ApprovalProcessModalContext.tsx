"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { ApprovalProcess } from "@/libs/types/approval";

interface ApprovalProcessModalContextType {
  isOpen: boolean;
  editingProcess: ApprovalProcess | null;
  openModal: (process?: ApprovalProcess) => void;
  closeModal: () => void;
}

const ApprovalProcessModalContext = createContext<ApprovalProcessModalContextType | undefined>(undefined);

export function ApprovalProcessModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<ApprovalProcess | null>(null);

  const openModal = (process?: ApprovalProcess) => {
    setEditingProcess(process || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setEditingProcess(null), 300);
  };

  return (
    <ApprovalProcessModalContext.Provider value={{ isOpen, editingProcess, openModal, closeModal }}>
      {children}
    </ApprovalProcessModalContext.Provider>
  );
}

export function useApprovalProcessModal() {
  const context = useContext(ApprovalProcessModalContext);
  if (!context) {
    throw new Error("useApprovalProcessModal must be used within ApprovalProcessModalProvider");
  }
  return context;
}
