"use client";

import { createContext, useContext, useState } from "react";

const SupportContext = createContext({
  isOpen: false,
  openSupport: () => {},
  closeSupport: () => {},
});

export function SupportProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openSupport = () => setIsOpen(true);
  const closeSupport = () => setIsOpen(false);

  return (
    <SupportContext.Provider value={{ isOpen, openSupport, closeSupport }}>
      {children}
    </SupportContext.Provider>
  );
}

export function useSupport() {
  return useContext(SupportContext);
}
