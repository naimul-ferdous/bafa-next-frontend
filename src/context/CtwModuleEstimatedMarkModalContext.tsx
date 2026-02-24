"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { CtwResultsModuleEstimatedMark } from "@/libs/types/ctw";

interface CtwModuleEstimatedMarkModalContextType {
  isOpen: boolean;
  moduleId: number | null;
  editingMark: CtwResultsModuleEstimatedMark | null;
  openModal: (moduleId: number, mark?: CtwResultsModuleEstimatedMark) => void;
  closeModal: () => void;
}

const CtwModuleEstimatedMarkModalContext = createContext<CtwModuleEstimatedMarkModalContextType | undefined>(undefined);

export function CtwModuleEstimatedMarkModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [moduleId, setModuleId] = useState<number | null>(null);
  const [editingMark, setEditingMark] = useState<CtwResultsModuleEstimatedMark | null>(null);

  const openModal = (mId: number, mark?: CtwResultsModuleEstimatedMark) => {
    setModuleId(mId);
    setEditingMark(mark || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => {
      setModuleId(null);
      setEditingMark(null);
    }, 300);
  };

  return (
    <CtwModuleEstimatedMarkModalContext.Provider value={{ isOpen, moduleId, editingMark, openModal, closeModal }}>
      {children}
    </CtwModuleEstimatedMarkModalContext.Provider>
  );
}

export function useCtwModuleEstimatedMarkModal() {
  const context = useContext(CtwModuleEstimatedMarkModalContext);
  if (context === undefined) {
    throw new Error("useCtwModuleEstimatedMarkModal must be used within a CtwModuleEstimatedMarkModalProvider");
  }
  return context;
}
