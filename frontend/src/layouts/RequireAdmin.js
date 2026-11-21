import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

/** Pages inside this route are for administrators (is_staff); others go back to the dashboard. */
const RequireAdmin = () => {
  const { userInfo } = useSelector((state) => state.auth);
  if (!userInfo.id) return null; // user info still loading
  return userInfo.is_staff ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

export default RequireAdmin;