import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleRoute from './components/common/RoleRoute';

import Splash from './pages/Splash';
import Welcome from './pages/Welcome';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyOTP from './pages/auth/VerifyOtp';
import ResetPassword from './pages/auth/ResetPassword';
import ResetSuccess from './pages/auth/ResetSuccess';

import Home from './pages/member/Home';
import Sermons from './pages/member/Sermons';
import Prayer from './pages/member/Prayer';
import Game from './pages/member/Game';
import Profile from './pages/member/Profile';
import Announcements from './pages/member/Announcements';
import Growth from './pages/member/Growth';
import Journal from './pages/member/Journal';
import Reflection from './pages/member/Reflection';
import MyGroups from './pages/member/MyGroups';

import Dashboard from './pages/worker/Dashboard';
import Offering from './pages/worker/Offering';
import Attendance from './pages/worker/Attendance';
import ServicePlan from './pages/worker/ServicePlan';
import Tasks from './pages/worker/Tasks';
import Groups from './pages/worker/Groups';
import GroupDetail from './pages/worker/GroupDetail';
import Projects from './pages/worker/Projects';
import ProjectDetail from './pages/worker/ProjectDetail';
import CreateProject from './pages/worker/CreateProject';

import Departments from './pages/admin/Department';
import DepartmentDashboard from './pages/admin/DepartmentDashboard';

import PastorDashboard from './pages/admin/PastorDashboard';
import SermonUpload from './pages/admin/SermonUpload';
import Notifications from './pages/admin/Notifications';
import Reports from './pages/admin/Reports';
import Events from './pages/admin/Events';
import Roles from './pages/admin/Roles';

import LeadDashboard from './pages/lead/LeadDashboard';
import LessonUpload from './pages/lead/LessonUpload';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 3500);
    return () => clearTimeout(t);
  }, []);

  if (showSplash) return <Splash />;

  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/forgot-password/verify" element={<VerifyOTP />} />
      <Route path="/forgot-password/reset" element={<ResetPassword />} />
      <Route path="/forgot-password/success" element={<ResetSuccess />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        {/* Member — everyone */}
        <Route path="/" element={<Home />} />
        <Route path="/sermons" element={<Sermons />} />
        <Route path="/sermons/:id/reflect" element={<Reflection />} />
        <Route path="/prayer" element={<Prayer />} />
        <Route path="/game" element={<Game />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/growth" element={<Growth />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/my-groups" element={<MyGroups />} />
        
        {/* NEW: Member accessible group chat */}
        <Route path="/groups/:id" element={<GroupDetail />} />

        {/* Worker */}
        <Route path="/worker" element={
          <RoleRoute allow={['worker', 'lead', 'admin']}><Dashboard /></RoleRoute>
        } />
        <Route path="/worker/offering" element={
          <RoleRoute allow={['worker', 'lead', 'admin']}><Offering /></RoleRoute>
        } />
        <Route path="/worker/attendance" element={
          <RoleRoute allow={['worker', 'lead', 'admin']}><Attendance /></RoleRoute>
        } />
        <Route path="/worker/service-plan" element={
          <RoleRoute allow={['worker', 'lead', 'admin']}><ServicePlan /></RoleRoute>
        } />
        <Route path="/worker/tasks" element={
          <RoleRoute allow={['worker', 'lead', 'admin']}><Tasks /></RoleRoute>
        } />
        <Route path="/worker/departments" element={
          <RoleRoute allow={['worker', 'lead', 'admin']}><Departments /></RoleRoute>
        } />
        <Route path="/worker/department/:id" element={
          <RoleRoute allow={['worker', 'lead', 'admin']}><DepartmentDashboard /></RoleRoute>
        } />
        <Route path="/worker/groups" element={
          <RoleRoute allow={['worker', 'lead', 'admin']}><Groups /></RoleRoute>
        } />
        <Route path="/worker/groups/:id" element={
          <RoleRoute allow={['worker', 'lead', 'admin']}><GroupDetail /></RoleRoute>
        } />
        <Route path="/worker/projects" element={
          <RoleRoute allow={['worker', 'lead', 'admin']}><Projects /></RoleRoute>
        } />
        <Route path="/worker/projects/new" element={
          <RoleRoute allow={['worker', 'lead', 'admin']}><CreateProject /></RoleRoute>
        } />
        <Route path="/worker/projects/:id" element={
          <RoleRoute allow={['worker', 'lead', 'admin']}><ProjectDetail /></RoleRoute>
        } />

        {/* Lead */}
        <Route path="/lead" element={
          <RoleRoute allow={['lead', 'admin']}><LeadDashboard /></RoleRoute>
        } />
        <Route path="/lead/lesson-upload" element={
          <RoleRoute allow={['lead', 'admin']}><LessonUpload /></RoleRoute>
        } />

        {/* Admin */}
        <Route path="/admin" element={
          <RoleRoute allow={['admin']}><PastorDashboard /></RoleRoute>
        } />
        <Route path="/admin/sermon-upload" element={
          <RoleRoute allow={['admin']}><SermonUpload /></RoleRoute>
        } />
        <Route path="/admin/notifications" element={
          <RoleRoute allow={['admin']}><Notifications /></RoleRoute>
        } />
        <Route path="/admin/roles" element={
          <RoleRoute allow={['admin']}><Roles /></RoleRoute>
        } />
        <Route path="/admin/reports" element={
          <RoleRoute allow={['admin']}><Reports /></RoleRoute>
        } />
        <Route path="/admin/events" element={
          <RoleRoute allow={['admin']}><Events /></RoleRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}