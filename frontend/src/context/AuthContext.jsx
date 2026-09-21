import React, { createContext, useContext, useState, useEffect } from 'react';
import { request } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bbms_token');
    if (token) {
      request('/auth/me')
        .then((res) => {
          if (res.success) {
            setUser(res.user);
          } else {
            localStorage.removeItem('bbms_token');
          }
        })
        .catch(() => {
          localStorage.removeItem('bbms_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.success && res.token) {
      localStorage.setItem('bbms_token', res.token);
      setUser(res.user);
    }
    return res;
  };

  const demoLogin = async (role, email) => {
    const res = await request('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role, email }),
    });
    if (res.success && res.token) {
      localStorage.setItem('bbms_token', res.token);
      setUser(res.user);
    }
    return res;
  };

  const registerDonor = async (formData) => {
    const res = await request('/auth/register-donor', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    if (res.success && res.token) {
      localStorage.setItem('bbms_token', res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('bbms_token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    demoLogin,
    registerDonor,
    logout,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'super_admin',
    isOrgAdmin: user?.role === 'org_admin',
    isVolunteer: user?.role === 'volunteer',
    isDonor: user?.role === 'donor',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
