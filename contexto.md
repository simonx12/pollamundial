# 📋 Contexto — PollaMundial 2026

## 🎯 Descripción General

**PollaMundial** es un sistema de pronósticos (polla/quiniela) para el **Mundial de Fútbol 2026** (USA, México, Canadá).  
Permite a múltiples usuarios registrarse, ingresar predicciones de marcador para cada partido, registrar su apuesta monetaria, y competir en un ranking global basado en puntos.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | React + Vite | React 19, Vite 6 |
| **Routing** | react-router-dom | v7 |
| **Iconos** | lucide-react | latest |
| **Estilos** | CSS puro (Vanilla CSS) | – |
| **Backend/Auth/DB** | Supabase | latest |
| **API de Resultados** | football-data.org (v4) | Free tier |

---

## 📁 Estructura del Proyecto

```
Polla/
├── index.html                 # Punto de entrada HTML
├── vite.config.js             # Configuración de Vite
├── package.json
├── .env.example               # Variables de entorno requeridas
├── contexto.md                # ← Este archivo
│
├── src/
│   ├── main.jsx               # Entry point React (proveedores)
│   ├── App.jsx                # Shell con Router + Auth gate
│   ├── App.css                # Estilos mínimos del App
│   ├── index.css              # 🎨 Design system completo
│   │
│   ├── context/
│   │   ├── AuthContext.jsx    # Autenticación (Supabase Auth)
│   │   └── ThemeContext.jsx   # Tema oscuro/claro
│   │
│   ├── lib/
│   │   ├── supabase.js        # Cliente Supabase + servicios CRUD
│   │   ├── footballApi.js     # API football-data.org
│   │   └── worldcupData.js    # Datos estáticos (48 equipos, 12 grupos)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx    # Navegación lateral
│   │   │   └── Sidebar.css
│   │   ├── match/
│   │   │   ├── MatchCard.jsx  # Tarjeta de partido + inputs
│   │   │   └── MatchCard.css
│   │   └── ui/
│   │       ├── Toast.jsx      # Notificaciones toast
│   │       ├── ThemeToggle.jsx # Switch oscuro/claro
│   │       └── ThemeToggle.css
│   │
│   └── pages/
│       ├── Login.jsx          # Login / Registro
│       ├── Login.css
│       ├── Dashboard.jsx      # Panel principal
│       ├── Predictions.jsx    # Todos los pronósticos
│       ├── Leaderboard.jsx    # Ranking global
│       └── Pages.css          # Estilos compartidos de páginas
```

---

## 🔐 Autenticación

- **Supabase Auth** con email + contraseña.
- Flujo: Login ↔ Registro en la misma pantalla.
- Al registrarse, se crea automáticamente un perfil en la tabla `profiles`.
- Sesión persistente vía `onAuthStateChange`.

### Tabla `profiles` (Supabase)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  bet_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📊 Sistema de Pronósticos

### Tabla `predictions`

```sql
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  points_earned INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);
```

### Tabla `match_results`

```sql
CREATE TABLE match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id TEXT UNIQUE NOT NULL,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  status TEXT DEFAULT 'FINISHED',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🏆 Sistema de Puntuación

| Resultado | Puntos | Ejemplo |
|-----------|--------|---------|
| **Marcador exacto** | 3 pts | Predijo 2-1, resultado 2-1 |
| **Acertó ganador/empate** | 1 pt | Predijo 3-1, resultado 2-0 (ambos gana local) |
| **Falló** | 0 pts | Predijo 1-0, resultado 0-2 |

La función `calculatePoints()` en `supabase.js` se ejecuta cuando un resultado se registra o sincroniza.

---

## 🌐 API de Resultados Automáticos

Usamos **football-data.org** (API v4, free tier):

- **Competición**: FIFA World Cup (ID: 2001, código: WC)
- **Límite**: 10 peticiones/minuto
- **Endpoints usados**:
  - `GET /competitions/2001/matches` — todos los partidos
  - `GET /competitions/2001/standings` — tabla de posiciones
- **Flujo de sincronización**:
  1. Se llama a `syncMatchesFromApi()`
  2. Se normalizan los datos al formato interno con `normalizeApiMatch()`
  3. Los partidos con status `FINISHED` actualizan `match_results` en Supabase
  4. Se ejecuta `calculatePoints()` para recalcular puntos

### Configuración

```env
VITE_FOOTBALL_API_KEY=tu-api-key-aqui
```

Regístrate gratis en: https://www.football-data.org/client/register

---

## 🌙 Temas (Dark / Light)

- **Dark** (por defecto): Fondo `#020617`, paneles con glassmorphism.
- **Light**: Fondo `#f1f5f9`, paneles blancos semitransparentes.
- Toggle animado con `ThemeToggle.jsx`.
- Persistencia en `localStorage` (key: `polla-theme`).
- Se aplica `data-theme` al `<html>` element.

---

## 💰 Apuestas

- Cada usuario define su monto de apuesta al registrarse o desde el Dashboard.
- Se muestra el **pozo total acumulado** en el Leaderboard.
- El pozo se calcula como la suma de `bet_amount` de todos los usuarios.

---

## 📱 Responsive

- **Desktop** (>1024px): Sidebar fijo a la izquierda (280px).
- **Tablet/Mobile** (≤1024px): Header fijo con hamburger. Sidebar tipo drawer.
- Grid de partidos: se adapta automáticamente con `auto-fill, minmax(340px, 1fr)`.

---

## 🚀 Cómo Ejecutar

```bash
# 1. Clonar/abrir el proyecto
cd Polla

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase y football-data.org

# 4. Ejecutar en modo desarrollo
npm run dev

# 5. Abrir en el navegador
# http://localhost:5173
```

---

## 📋 Configuración de Supabase

1. Crear proyecto en https://supabase.com
2. Ejecutar las queries SQL de las tablas (`profiles`, `predictions`, `match_results`)
3. Copiar la URL y la Anon Key al `.env`
4. Habilitar autenticación por email en: Authentication > Providers > Email
5. (Opcional) Configurar RLS (Row Level Security) para proteger datos:

```sql
-- Los usuarios solo pueden ver/editar sus propios pronósticos
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own predictions" ON predictions
  FOR ALL USING (auth.uid() = user_id);

-- Perfiles visibles para todos (leaderboard)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Resultados visibles para todos
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match results are viewable by everyone" ON match_results
  FOR SELECT USING (true);
```

---

## 🔮 Roadmap / Mejoras Futuras

- [ ] Sincronización automática con cron job (Supabase Edge Functions)
- [ ] Notificaciones push cuando un partido empieza
- [ ] Chat grupal entre participantes
- [ ] Predicciones de fase eliminatoria
- [ ] Exportar ranking a PDF
- [ ] Modo admin para ingresar resultados manualmente
- [ ] Integración con métodos de pago (Nequi, Daviplata)
- [ ] PWA con service worker para uso offline
