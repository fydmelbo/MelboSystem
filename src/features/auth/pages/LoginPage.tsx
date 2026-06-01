import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LoginForm } from '../components/LoginForm';
import { loginWithFirebase } from '../services/authService';
// @ts-ignore
import fondoLogin from '../../../img/FondoLogin.png';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const navigate = useNavigate();

  const { login: authLogin } = useAuth();

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userProfile = await loginWithFirebase(email, password);
      authLogin(userProfile);
      toast.success('Inicio de sesión exitoso');
      navigate('/welcome');
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al iniciar sesión';
      toast.error(errorMessage);
      console.error('Error de login:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 md:p-6">
      <div className={`w-full max-w-[1200px] min-h-[600px] bg-white rounded-[30px] shadow-xl flex flex-col lg:flex-row transform transition-all duration-500 ${isPageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        {/* Left side - Illustration */}
        <div className="relative w-full lg:w-[60%] bg-gradient-to-br from-blue-50 to-white p-8 flex items-center justify-center order-2 lg:order-1">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={fondoLogin}
              alt="Melbo pharmacy illustration"
              className="w-full h-auto object-contain max-w-[500px] lg:max-w-none transform transition-all duration-[2s] ease-in-out hover:scale-105"
              style={{ animation: 'float 6s ease-in-out infinite' }}
            />
          </div>
          {/* Decorative circles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-blue-200 rounded-full opacity-10 animate-pulse"></div>
            <div className="absolute bottom-[15%] right-[15%] w-48 h-48 bg-green-200 rounded-full opacity-10 animate-pulse delay-1000"></div>
            <div className="absolute top-[40%] right-[20%] w-32 h-32 bg-purple-200 rounded-full opacity-10 animate-pulse delay-2000"></div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full lg:w-[40%] flex items-center justify-center p-6 md:p-8 order-1 lg:order-2 bg-gradient-to-br from-white to-blue-50/30">
          <LoginForm
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}