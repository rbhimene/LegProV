import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/** Pages inside this route need a logged-in user, otherwise go to /login. */
const RequireAuth = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
};

export default RequireAuth;