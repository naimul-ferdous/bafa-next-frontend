"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CadetProfile } from '@/libs/types/user';

interface CadetAssignmentModalContextType {
  isOpen: boolean;
  cadet: CadetProfile | null;
  openModal: (cadet: CadetProfile) => void;
  closeModal: () => void;
}

const CadetAssignmentModalContext = createContext<CadetAssignmentModalContextType | undefined>(undefined);

export function useCadetAssignmentModal() {
  const context = useContext(CadetAssignmentModalContext);
  if (!context) {
    throw new Error('useCadetAssignmentModal must be used within a CadetAssignmentModalProvider');
  }
  return context;
}

interface CadetAssignmentModalProviderProps {
  children: ReactNode;
}

export function CadetAssignmentModalProvider({ children }: CadetAssignmentModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [cadet, setCadet] = useState<CadetProfile | null>(null);

  const openModal = (selectedCadet: CadetProfile) => {
    setCadet(selectedCadet);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setCadet(null);
  };

  return (
    <CadetAssignmentModalContext.Provider value={{ isOpen, cadet, openModal, closeModal }}>
      {children}
    </CadetAssignmentModalContext.Provider>
  );
}
