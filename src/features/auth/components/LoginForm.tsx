import React, { useState } from 'react';
import { Lock, Mail, Loader, Eye, EyeOff } from 'lucide-react';
import logo from '../../../img/LOGO (1).png';

interface LoginFormProps {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
}

export function LoginForm({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  isLoading = false
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState<string | null>(null);

  return (
    <div className="w-full max-w-[400px] mx-auto bg-white p-8 rounded-2xl shadow-lg">
      <form onSubmit={onSubmit} className="flex flex-col space-y-8">
        {/* Logo and Welcome Text */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img
              src={logo}
              alt="Melbo Logo"
              className="h-20 w-auto object-contain transition-transform duration-300 hover:scale-105"
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-blue-900">Bienvenid@</h1>
            <p className="text-sm text-gray-500">Inicia sesión para continuar</p>
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-4">
          <div className={`relative transition-all duration-300 ${
            isFocused === 'email' ? 'transform scale-[1.02]' : ''
          }`}>
            <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
              isFocused === 'email' ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <input
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 outline-none"
              placeholder="Ingresa tu email"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              onFocus={() => setIsFocused('email')}
              onBlur={() => setIsFocused(null)}
              disabled={isLoading}
              required
            />
          </div>

          <div className={`relative transition-all duration-300 ${
            isFocused === 'password' ? 'transform scale-[1.02]' : ''
          }`}>
            <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
              isFocused === 'password' ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <input
              className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 outline-none"
              placeholder="Contraseña"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              onFocus={() => setIsFocused('password')}
              onBlur={() => setIsFocused(null)}
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg transform transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
        >
          {isLoading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Iniciando sesión...</span>
            </>
          ) : (
            'Iniciar Sesión'
          )}
        </button>
      </form>
    </div>
  );
}