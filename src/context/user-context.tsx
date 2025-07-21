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
    const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);

// Registration function (call this when registering a new user)
    const register = useCallback((email: string, name: string) => {
        setRegisteredUsers(prev => [...prev, { email, name }]);
    }, []);

// Update login to check if user exists
    const login = useCallback((email: string, name: string) => {
        const userExists = registeredUsers.some(user => user.email === email);
        if (userExists) {
            setUser({ email, name });
            setIsAuthenticated(true);
        } else {
            setUser(null);
            setIsAuthenticated(false);
            // Optionally, show an error message
        }
    }, [registeredUsers]);

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
