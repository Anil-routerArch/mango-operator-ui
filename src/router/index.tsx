import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layout/AppLayout';
import { LoginPage } from '@/pages/Login/LoginPage';
import { UsersPage } from '@/pages/Users/UsersPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Main App Layout - Users & Access Dashboard */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<UsersPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/dashboard" element={<UsersPage />} />
        <Route path="/properties" element={<UsersPage />} />
        <Route path="/devices" element={<UsersPage />} />
        <Route path="/configuration" element={<UsersPage />} />
      </Route>

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
