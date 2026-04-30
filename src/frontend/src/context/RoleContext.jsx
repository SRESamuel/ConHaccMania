import { createContext, useContext, useState } from 'react';

const RoleContext = createContext();

export function RoleProvider({ children }) {
  const [role, setRole] = useState(() => localStorage.getItem('role') || 'student');

  const toggleRole = () => {
    setRole(prev => {
      const next = prev === 'student' ? 'instructor' : 'student';
      localStorage.setItem('role', next);
      return next;
    });
  };

  return (
    <RoleContext.Provider value={{ role, toggleRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
