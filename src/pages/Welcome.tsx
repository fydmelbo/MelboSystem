import MainLayout from '../components/layout/MainLayout';
import { Package, ShoppingCart, FileText, TrendingUp, Pill, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import iconoInicio from '../img/iconoInicio.png';
import React from 'react';

export default function Welcome() {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Inventario',
      description: 'Gestiona tus productos y medicamentos',
      icon: Package,
      path: '/products',
      color: 'bg-blue-500'
    },
    {
      title: 'Ventas',
      description: 'Realiza y gestiona las ventas diarias',
      icon: ShoppingCart,
      path: '/sales',
      color: 'bg-green-500'
    },
    {
      title: 'Reportes',
      description: 'Visualiza estadísticas y genera informes',
      icon: FileText,
      path: '/reports',
      color: 'bg-purple-500'
    },
    {
      title: 'Panel Administrativo',
      description: 'Administra tu sistema con estadisticas avanzadas',
      icon: LayoutDashboard,
      path: '/admin',
      color: 'bg-red-500'
    }
  ];

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-blue-50 to-white p-6">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto mb-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <div className="flex items-center gap-3 mb-4">
                <Pill className="h-8 w-8 text-blue-600" />
                <h1 className="text-4xl font-bold text-gray-800">
                  Sistema Farmacéutico Melbo
                </h1>
              </div>
              <p className="text-lg text-gray-600 mb-6">
                Bienvenido al sistema de gestión integral para Melbo. 
                Administra tu inventario, ventas y reportes de manera eficiente.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span>Control de Inventario</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  <span>Gestión de Productos</span>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <img 
                src={iconoInicio}
                alt="Pharmacy Management" 
                className="rounded-lg w-24 h-24"
              />
            </div>
          </div>
        </div>

        {/* Menu Cards */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item) => (
            <button
              key={item.title}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 text-left border border-gray-100 group"
            >
              <div className={`${item.color} text-white p-3 rounded-lg inline-block mb-4 group-hover:scale-110 transition-transform`}>
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </button>
          ))}
        </div>

        {/* Footer Stats */}
        <div className="max-w-7xl mx-auto mt-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Acceso Rápido al Sistema</h2>
          <p className="text-gray-600">
            Selecciona cualquiera de las opciones anteriores para comenzar a gestionar tu farmacia 
            de manera eficiente y profesional.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}