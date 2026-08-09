import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  registerStudent: (name: string, email: string, pass: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('quiz_app_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('quiz_app_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    const data = await api.login(email, pass);
    setUser(data.user);
    localStorage.setItem('quiz_app_user', JSON.stringify(data.user));
    localStorage.setItem('quiz_app_token', data.token);
    return data.user;
  };

  const registerStudent = async (name: string, email: string, pass: string): Promise<User> => {
    const data = await api.registerStudent(name, email, pass);
    setUser(data.user);
    localStorage.setItem('quiz_app_user', JSON.stringify(data.user));
    localStorage.setItem('quiz_app_token', data.token);
    return data.user;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('quiz_app_user');
    localStorage.removeItem('quiz_app_token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, registerStudent, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
