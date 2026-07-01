import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { Notifications } from './pages/Notifications';
import { CommunityPosts } from './pages/CommunityPosts';
import { Feedback } from './pages/Feedback';
import { Bills } from './pages/Bills';
import { UserDetail } from './pages/UserDetail';
import { Analytics } from './pages/Analytics';
import { Stations } from './pages/Stations';
import { Moderation } from './pages/Moderation';
import { AuditLog } from './pages/AuditLog';
import { Admins } from './pages/Admins';

const App: React.FC = () => {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.1)' } }} />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="users/:id" element={<UserDetail />} />
            <Route path="community-posts" element={<CommunityPosts />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="bills" element={<Bills />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="stations" element={<Stations />} />
            <Route path="moderation" element={<Moderation />} />
            <Route path="audit-log" element={<AuditLog />} />
            <Route path="admins" element={<Admins />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default App;
