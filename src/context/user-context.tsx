"use client";

import React, { createContext, useState, ReactNode, useCallback } from "react";
import { COMMON_ALLERGENS } from "@/lib/data";

interface User {
  name: string;
  email: string;
}

interface UserContextType {
  isAuthenticated: boolean;
  user: User | null;
  allergens: string[];
  login: (email: string, name: string) => void;
  logout: () => void;
  updateAllergens: (newAllergens: string[]) => void;
  addCustomAllergen: (allergen: string) => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [allergens, setAllergens] = useState<string[]>(COMMON_ALLERGENS.slice(0, 3)); // Default with a few allergies

  const login = useCallback((email: string, name: string) => {
    setUser({ email, name });
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateAllergens = useCallback((newAllergens: string[]) => {
    setAllergens(newAllergens);
  }, []);

  const addCustomAllergen = useCallback((allergen: string) => {
    if (allergen && !allergens.includes(allergen)) {
      setAllergens(prev => [...prev, allergen]);
    }
  }, [allergens]);

  return (
    <UserContext.Provider
      value={{
        isAuthenticated,
        user,
        allergens,
        login,
        logout,
        updateAllergens,
        addCustomAllergen,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
