"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { AtwUniversityDepartment } from "@/libs/types/system";

interface DepartmentModalContextType {
  isOpen: boolean;
  editingDepartment: AtwUniversityDepartment | null;
  openModal: (department?: AtwUniversityDepartment) => void;
  closeModal: () => void;
}

const DepartmentModalContext = createContext<DepartmentModalContextType | undefined>(undefined);

export function AtwUniversityDepartmentModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<AtwUniversityDepartment | null>(null);

  const openModal = (department?: AtwUniversityDepartment) => {
    setEditingDepartment(department || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setEditingDepartment(null), 300);
  };

  return (
    <DepartmentModalContext.Provider value={{ isOpen, editingDepartment, openModal, closeModal }}>
      {children}
    </DepartmentModalContext.Provider>
  );
}

export function useAtwUniversityDepartmentModal() {
  const context = useContext(DepartmentModalContext);
  if (context === undefined) {
    throw new Error("useAtwUniversityDepartmentModal must be used within a AtwUniversityDepartmentModalProvider");
  }
  return context;
}
