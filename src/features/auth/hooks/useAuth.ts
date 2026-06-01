import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export function useAuth() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  return { isAuthenticated: !!token };
}