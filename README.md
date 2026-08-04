# MelboSystem

Sistema de gestión farmaceutica para la cadena de farmacias Melbo. Aplicación web SPA para administrar inventario, ventas, reportes, usuarios y promociones en múltiples ubicaciones.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** Firebase (Firestore, Firebase Auth, Firebase Hosting)
- **Gráficas:** Recharts
- **Animaciones:** Framer Motion
- **Reportes:** jsPDF, xlsx (SheetJS)
- **Iconos:** Lucide React

## Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Vista previa del build
npm run preview
```

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot reload |
| `npm run build` | Build optimizado para producción |
| `npm run preview` | Vista previa del build de producción |
| `npm run lint` | Verificar código con ESLint |
| `npm run test` | Ejecutar tests en modo watch |
| `npm run test:run` | Ejecutar tests una vez |

## Estructura del proyecto

```
src/
├── components/          # Componentes compartidos
│   ├── layout/          # MainLayout, Navbar, Sidebar
│   └── ui/              # BaseModal, Pagination
├── features/            # Módulos por dominio
│   ├── auth/            # Autenticación y roles
│   ├── products/        # Gestión de productos
│   ├── sales/           # Punto de venta
│   ├── reports/         # Reportes diarios/rango
│   ├── stats/           # Estadísticas y dashboard
│   ├── users/           # Gestión de usuarios
│   ├── promotions/      # Promociones y descuentos
│   ├── audit/           # Registro de auditoría
│   └── notifications/   # Alertas de stock/vencimiento
├── config/              # Configuración de Firebase
├── hooks/               # Hooks globales
├── lib/                 # Servicios API (Firestore)
├── utils/               # Utilidades (formato moneda/fechas)
└── img/                 # Imágenes del proyecto
```

## Roles de usuario

| Rol | Permisos |
|---|---|
| `admin` | Acceso total: CRUD productos, ubicaciones, usuarios, reportes, estadísticas, auditoría |
| `admin_ubicacion` | Gestión de productos, ventas, reportes y estadísticas de su ubicación |
| `employee` | Ventas, consulta de productos y reportes de su ubicación |

## Funcionalidades

- **Inventario multi-ubicación:** Productos organizados por farmacia con subcolecciones en Firestore
- **Punto de venta:** Escaneo de código de barras, carrito, pagos divididos (efectivo/tarjeta/transferencia)
- **Promociones:** Descuentos porcentaje, fijos y NxM (Lleva X paga Y)
- **Reportes:** Generación diaria con exportación a PDF y Excel
- **Dashboard admin:** Gráficas de ventas mensuales/diarias, productos top, métricas financieras
- **Gestión de usuarios:** Creación con Firebase Auth secundario, roles y ubicaciones
- **Transferencias:** Movimiento de productos entre ubicaciones
- **Auditoría:** Registro completo de acciones CRUD
- **Alertas:** Notificaciones de stock bajo y productos próximos a vencer

## Variables de entorno

El proyecto actualmente usa configuración de Firebase directa en `src/config/firebase.ts`. Para gestionar por ambiente, crear un archivo `.env`:

```
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

## Despliegue

El proyecto se despliega en Firebase Hosting:

```bash
# Build
npm run build

# Desplegar
firebase deploy --only hosting
```

## License

Privado - Farmacias Melbo
