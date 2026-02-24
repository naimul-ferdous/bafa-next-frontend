"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Rank } from "@/libs/types/user";

interface RankModalContextType {
  isOpen: boolean;
  editingRank: Rank | null;
  openModal: (rank?: Rank) => void;
  closeModal: () => void;
}

const RankModalContext = createContext<RankModalContextType | undefined>(undefined);

export function RankModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingRank, setEditingRank] = useState<Rank | null>(null);

  const openModal = (rank?: Rank) => {
    setEditingRank(rank || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setEditingRank(null), 300);
  };

  return (
    <RankModalContext.Provider value={{ isOpen, editingRank, openModal, closeModal }}>
      {children}
    </RankModalContext.Provider>
  );
}

export function useRankModal() {
  const context = useContext(RankModalContext);
  if (!context) {
    throw new Error("useRankModal must be used within RankModalProvider");
  }
  return context;
}
