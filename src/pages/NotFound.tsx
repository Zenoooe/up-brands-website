import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    // Immediate redirect to home
    navigate('/', { replace: true });
  }, [navigate]);

  return null; // Render nothing while redirecting
}
