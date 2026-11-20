import { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeContext } from './contexts/theme';
import AppLayout from './layouts/AppLayout';
import RequireAuth from './layouts/RequireAuth';
import HomePage from './HomePage';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import Dashboard from './components/Dashboard/Dashboard';
import ProjectDetailsPage from './components/Dashboard/ProjectDetailsPage';
import VerifFront from './components/VerifFront/VerifFront';
import UserManagement from './components/UserManagement/UserManagement';
import DiagramDetails from './components/DiagamDetails/DiagarmDetails';
import './App.css';

const App = () => {
  const [{ themeName }] = useContext(ThemeContext);

  return (
    <div id="top" className={`${themeName} app`}>
      <Router>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/diagrams/:id" element={<DiagramDetails />} />
            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/project/:projectId" element={<ProjectDetailsPage />} />
              <Route path="/dashboard/project/:projectId/verify/:diagramId" element={<VerifFront />} />
              <Route path="/dashboard/user-management" element={<UserManagement />} />
            </Route>
          </Route>
        </Routes>
      </Router>
      <ToastContainer position="bottom-right" theme={themeName} autoClose={3500} />
    </div>
  );
};

export default App;