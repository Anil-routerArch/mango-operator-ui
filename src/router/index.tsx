import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layout/AppLayout';
import { ProtectedRoute } from '@/router/ProtectedRoute';
import { LoginPage } from '@/pages/Login/LoginPage';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { PropertiesPage } from '@/pages/Properties/PropertiesPage';
import { DevicesPage } from '@/pages/Devices/DevicesPage';
import { ConfigurationPage } from '@/pages/Configuration/ConfigurationPage';
import { UsersPage } from '@/pages/Users/UsersPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes (requires authentication token) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/devices" element={<DevicesPage />} />
          <Route path="/configuration" element={<ConfigurationPage />} />
          <Route path="/users" element={<UsersPage />} />
        </Route>
      </Route>

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
