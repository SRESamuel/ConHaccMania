import { createContext, useContext, useState } from 'react';

const USERS = [
  { id: 'student-samuel', role: 'student', name: 'Samuel Ricardo Estrada', initials: 'SE' },
  { id: 'student-jindo', role: 'student', name: 'Jindo Kim', initials: 'JK' },
  { id: 'instructor', role: 'instructor', name: 'Aeiman Gadafi', initials: 'AG' },
];

const RoleContext = createContext();

export function RoleProvider({ children }) {
  const [userId, setUserId] = useState(() => localStorage.getItem('userId') || 'student-jindo');

  const switchUser = (id) => {
    setUserId(id);
    localStorage.setItem('userId', id);
  };

  const currentUser = USERS.find(u => u.id === userId) || USERS[1];

  return (
    <RoleContext.Provider value={{ currentUser, users: USERS, switchUser }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const { currentUser, users, switchUser } = useContext(RoleContext);
  return {
    role: currentUser.role,
    currentUser,
    users,
    switchUser,
  };
}
