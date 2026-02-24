"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { SystemExam } from "@/libs/types/system";

interface ExamModalContextType {
  isOpen: boolean;
  editingExam: SystemExam | null;
  openModal: (exam?: SystemExam) => void;
  closeModal: () => void;
}

const ExamModalContext = createContext<ExamModalContextType | undefined>(undefined);

export function ExamModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<SystemExam | null>(null);

  const openModal = (exam?: SystemExam) => {
    setEditingExam(exam || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setEditingExam(null), 300);
  };

  return (
    <ExamModalContext.Provider value={{ isOpen, editingExam, openModal, closeModal }}>
      {children}
    </ExamModalContext.Provider>
  );
}

export function useExamModal() {
  const context = useContext(ExamModalContext);
  if (context === undefined) {
    throw new Error("useExamModal must be used within an ExamModalProvider");
  }
  return context;
}
