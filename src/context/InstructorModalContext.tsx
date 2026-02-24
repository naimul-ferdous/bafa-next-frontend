"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { InstructorBiodata } from "@/libs/types/user";

interface InstructorModalContextType {
  isOpen: boolean;
  editingInstructor: InstructorBiodata | null;
  openModal: (instructor?: InstructorBiodata) => void;
  closeModal: () => void;
}

const InstructorModalContext = createContext<InstructorModalContextType | undefined>(undefined);

export function InstructorModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<InstructorBiodata | null>(null);

  const openModal = (instructor?: InstructorBiodata) => {
    setEditingInstructor(instructor || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setEditingInstructor(null), 300);
  };

  return (
    <InstructorModalContext.Provider value={{ isOpen, editingInstructor, openModal, closeModal }}>
      {children}
    </InstructorModalContext.Provider>
  );
}

export function useInstructorModal() {
  const context = useContext(InstructorModalContext);
  if (context === undefined) {
    throw new Error("useInstructorModal must be used within an InstructorModalProvider");
  }
  return context;
}
