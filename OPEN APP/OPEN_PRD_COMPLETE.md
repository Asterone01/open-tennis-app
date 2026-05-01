# OPEN - Product Requirements Document (PRD)

**Status:** In Validation (MVP Phase)  
**Version:** 4.0  
**Last Updated:** April 2025  
**Author:** Founder  
**Audience:** Development Team, Stakeholders, Investors

---

## 📑 TABLA DE CONTENIDOS

1. [Visión & Estrategia](#visión--estrategia)
2. [Descripción del Producto](#descripción-del-producto)
3. [Usuarios & Personas](#usuarios--personas)
4. [Necesidades del Mercado](#necesidades-del-mercado)
5. [Característica Principales](#características-principales)
6. [Especificaciones Técnicas](#especificaciones-técnicas)
7. [Flujos de Usuario](#flujos-de-usuario)
8. [Métricas de Éxito](#métricas-de-éxito)
9. [Roadmap](#roadmap)
10. [Consideraciones Especiales](#consideraciones-especiales)

---

# 1. VISIÓN & ESTRATEGIA

## 1.1 Declaración de Visión

**OPEN elimina fricción en la organización de tenis.**

Jugadores, coaches y clubs gastan tiempo valioso:
- Organizando partidos por WhatsApp (caos)
- Sin ranking oficial (conflicto)
- Perdiendo historial de entrenamientos (olvido)
- Sin datos de progreso (frustración)

**OPEN centraliza todo:** Partidos → Torneos → Ranking → XP → Logros → Comunidad.

## 1.2 Misión

**Conectar jugadores, coaches y clubs de tenis para mejorar la experiencia competitiva y comunitaria.**

## 1.3 Valores Fundamentales

| Valor | Significado |
|---|---|
| **Fricción Zero** | Cada feature debe ser 10x más fácil que WhatsApp |
| **Datos Imparciales** | Ranking, XP, y métricas = truth, no opinión |
| **Comunidad Primero** | Features que conectan usuarios, no aislan |
| **Gamificación Auténtica** | XP/logros que importan, no vanity metrics |
| **Blanco & Negro** | Diseño limpio, sin exceso, enfocado |

## 1.4 Estrategia de Mercado

### Posicionamiento
- **Competidor Directo:** WhatsApp (actual solución)
- **Competidor Indirecto:** Otros apps de tenis (Ball Buddies, TennisExplorer)
- **Diferenciador:** White-label + Comunidad local + Gamificación

### Modelo de Negocio
```
Free Tier:
├─ Jugadores ilimitados
├─ 5 amistosos/mes
├─ 2 torneos/temporada
├─ Coaches: 2
└─ Ranking local

Premium Tier ($2,550/mes):
├─ Amistosos ilimitados
├─ Torneos ilimitados
├─ Coaches ilimitados
├─ White-label completo
├─ Analytics avanzado
└─ Soporte prioritario
```

### Mercado Target
- **Geográfico:** LATAM (inicio: Estado de México)
- **Demográfico:** Clubs de tenis 20-70 años
- **Psicográfico:** Competitivos, comunitarios, digitales
- **Tamaño:** ~5,000 clubs en LATAM × 40 personas promedio = 200k potential users

---

# 2. DESCRIPCIÓN DEL PRODUCTO

## 2.1 Qué es OPEN

**OPEN es una plataforma digital de gestión integrada para tenis amateur.**

Funciona en:
- ✅ Web (React + Vite)
- ✅ Mobile (PWA)
- 🔜 iOS/Android (React Native - Fase 6)

**No requiere:** Instalación, setup, mantenimiento.  
**Usa:** Supabase (backend), Vercel (hosting), Tailwind (diseño).

## 2.2 Por Qué Existe

**Problema 1:** Caos en WhatsApp
- 50 mensajes por día
- Nadie se enteraba de nada
- Conflictos sobre resultados

**Problema 2:** Sin ranking oficial
- "Yo soy mejor que tú"
- No hay verdad objetiva
- Frustración entre jugadores

**Problema 3:** Sin progreso visible
- No ves tu mejora
- Sin motivación de largo plazo
- Sin data de entrenamientos

**Problema 4:** Coaches desorganizados
- Evaluaciones en papel
- Sin seguimiento de alumnos
- Sin plan estructurado

**Solución:** OPEN centraliza, ordena y gamifica todo.

## 2.3 Casos de Uso Principales

### Caso 1: Jugador Amateur
```
Lunes: Abre app → Ve ranking → Ve próximos partidos
Miércoles: Crea partido vs Carlos (amistoso)
Viernes: Carlos confirma, XP acreditado (+50)
Fin de semana: Ve su progreso, logro desbloqueado
```

### Caso 2: Coach
```
Semana 1: Crea 5 alumnos en el sistema
Semana 2: Planifica entrenamientos, toma asistencia
Semana 3: Evalúa progreso, sugiere ascensos
Mes: Ve todas las métricas de sus alumnos
```

### Caso 3: Admin de Club
```
Mes 1: Registra club, agrega coaches y jugadores
Mes 2: Crea torneos, genera brackets, ve resultados
Mes 3: Paga premium, activa white-label personalizado
Año: Club genera $2,550/mes de ingresos extra
```

---

# 3. USUARIOS & PERSONAS

## 3.1 Tipos de Usuarios (4)

### Persona 1: PLAYER (Jugador)
- **Edad:** 20-60 años
- **Motivación:** Jugar, competir, mejorar
- **Pain Points:** Desorganización, falta de ranking, sin feedback
- **Goals:** Subir de categoría, ganar torneos, mejorar skills
- **Features Usadas:** Partidos, ranking, XP, logros, rachas
- **Frecuencia:** 3-5 veces/semana
- **Conversión:** Libre → Premium (raro, solo si coach requiere)

### Persona 2: COACH (Entrenador)
- **Edad:** 25-70 años
- **Motivación:** Entrenar, mejorar alumnos, ganar torneos
- **Pain Points:** Alumnos desorganizados, sin tracking, evaluaciones manuales
- **Goals:** Estructura, progreso visible, ascensos meritocráticos
- **Features Usadas:** Panel de alumnos, evaluaciones, entrenamientos, torneos
- **Frecuencia:** Diario
- **Conversión:** Libre → Premium (si club necesita white-label)

### Persona 3: ADMIN DE CLUB (Administrador)
- **Edad:** 35-70 años
- **Motivación:** Organizar, monetizar, mejorar club
- **Pain Points:** Gestión manual, sin ingresos digitales, comunicación fragmentada
- **Goals:** Automatización, ingresos recurrentes, comunidad engaged
- **Features Usadas:** Dashboard, clubs, torneos, pagos, white-label
- **Frecuencia:** Diario
- **Conversión:** Libre → Premium (100%, valor claro)

### Persona 4: GUEST (Invitado)
- **Edad:** Cualquier edad
- **Motivación:** Jugar en torneo abierto
- **Pain Points:** Sin perfil previo, datos temporales
- **Goals:** Participar sin comprometerse
- **Features Usadas:** Torneos abiertos, resultados, perfil temporal
- **Frecuencia:** Esporádico
- **Conversión:** No

## 3.2 Matriz de Acceso

| Feature | Player | Coach | Admin | Guest |
|---|---|---|---|---|
| Ver perfil | Propia + club | Propios alumnos | Todos | No |
| Crear partido | ✅ | ✅ | ✅ | ❌ |
| Ver ranking | ✅ | ✅ | ✅ | ❌ |
| Evaluar | ❌ | ✅ | ❌ | ❌ |
| Crear torneo | ❌ | ✅ | ✅ | ❌ |
| White-label | ❌ | ❌ | ✅ | ❌ |
| Ver stats | Propias | Alumnos | Club | No |

---

# 4. NECESIDADES DEL MERCADO

## 4.1 Investigación de Mercado

### Validación Realizada
- ✅ Encuestas: 40 coaches/admins
- ✅ Entrevistas: 12 clubs
- ✅ Observación: 6 entrenamientos

### Hallazgos Principales

**Hallazgo 1: Caos en WhatsApp es REAL**
- 100% de los clubs usa WhatsApp
- 85% dice "es complicado"
- 70% pierde mensajes importantes

**Hallazgo 2: Ranking oficial es CRÍTICO**
- 92% quiere ranking
- 78% ha tenido conflictos por resultados
- 100% dice "sería más justo"

**Hallazgo 3: Evaluaciones son MANUALES**
- 100% de coaches usa papel
- 80% pierde registros
- 65% quiere herramienta digital

**Hallazgo 4: Dinero está en PREMIUM**
- 100% de admins pagaría por automación
- $2,000-3,000/mes máximo
- White-label es dealbreaker

## 4.2 TAM/SAM/SOM

```
TAM (Total Addressable Market):
├─ LATAM: 50,000 clubs × 40 personas = 2M potential users
└─ Global: 200M jugadores de tenis

SAM (Serviceable Available Market):
├─ LATAM Premium: 2,000 clubs que pueden pagar
└─ = 80K users × $2,550/mes = $204M potential

SOM (Serviceable Obtainable Market - Year 1):
├─ Meta realista: 50 clubs = 2,000 users
├─ Ingresos: 44 clubs premium × $2,550 = $112,200/year
└─ Conservador (30% conversión)
```

## 4.3 Trend Analysis

| Trend | Relevancia |
|---|---|
| **Gamificación** | Alto - XP/logros / rachas muy populares |
| **Mobile First** | Alto - 95% acceso desde móvil |
| **Community** | Alto - Tenis es deporte social |
| **White-label SaaS** | Alto - Clubs quieren "su app" |
| **Sports Analytics** | Medio - Aún básico en tenis amateur |

---

# 5. CARACTERÍSTICAS PRINCIPALES

## 5.1 Matriz de Features

### Core Features (MVP - Fases 1-2)

| Feature | Descripción | Prioridad | Fase |
|---|---|---|---|
| **Perfil de Jugador** | Avatar, XP, rating, skills | P0 | 1 |
| **Partidos Amistosos** | Quick match con rival | P0 | 1 |
| **Sistema de XP** | Ganar XP por actividad | P0 | 1 |
| **Ranking Local** | Tabla de posiciones del club | P0 | 1 |
| **Panel de Coach** | Ver alumnos y evaluaciones | P0 | 2 |
| **Evaluaciones** | 6 habilidades con sliders | P0 | 2 |
| **Entrenamientos** | Planificar y tomar asistencia | P0 | 2 |
| **Torneos** | Crear y gestionar | P1 | 3 |
| **Bracket Automático** | Generación de cuadro | P1 | 3 |
| **Admin Dashboard** | Overview del club | P1 | 4 |

### Enhancement Features (Fases 3-5)

| Feature | Descripción | Prioridad |
|---|---|---|
| **Logros/Medallas** | 20+ achievements desbloqueables | P1 |
| **Rachas** | Streaks de entrenamientos, victorias | P1 |
| **Trofeos Digitales** | Digital trophy con share | P1 |
| **White-label** | Customización de marca | P2 |
| **Pagos** | Stripe/Conekta integration | P2 |
| **Live Scoring** | Juez en tiempo real | P2 |
| **Analytics** | Stats avanzadas | P2 |
| **Chat** | Mensajería entre usuarios | P3 |

### Growth Features (Fases 6+)

| Feature | Descripción | Prioridad |
|---|---|---|
| **iOS/Android Apps** | React Native | P3 |
| **Coach Marketplace** | Coaches independientes | P4 |
| **Video Analysis** | Upload y análisis | P4 |
| **Wearables Integration** | Apple Health, Garmin | P4 |
| **Inter-club League** | Liga entre clubs | P4 |

## 5.2 Especificación de Features Principales

### Feature: Sistema de XP

**Descripción:**  
Mecanismo de gamificación que otorga puntos a jugadores por diferentes actividades.

**Cálculo:**
```
Entrenamientos:
├─ Asistencia: +50 XP
├─ Racha 3 días: +50 bonus
├─ Racha 5 días: +75 bonus
└─ Racha 10 días: +100 bonus

Amistosos:
├─ Jugar: +30 XP
├─ Ganar: +20 extra
├─ Perder: +10 extra
└─ Con juez: +15 extra

Torneos (por fase):
├─ R1: +80 XP
├─ R2: +40 XP
├─ QF: +60 XP
├─ SF: +80 XP
├─ Runner-up: +100 XP
└─ Campeón: +200 XP
```

**Reglas:**
- XP nunca disminuye
- XP es global (cross-club)
- Calculated en tiempo real
- Mostrado en profile hero card
- Rangos cada 500 XP: Bronce, Plata, Oro, Platino

**UI/UX:**
```
Hero Card:
┌─────────────────┐
│ 🏆 Carlos R.    │
│ Level 5 (2,340 XP)
│ Cat: B | Rating: 78
└─────────────────┘

Toast notification:
⚡ +50 XP - Entrenamiento
```

---

### Feature: Panel de Coach

**Descripción:**  
Dashboard centralizado para que coaches gestionen alumnos, evaluaciones y entrenamientos.

**Tabs (5):**
1. **Mis Alumnos** - Tabla con foto, nombre, categoría, rating, XP, última eval
2. **Ranking** - Ranking filterable por categoría
3. **Torneos** - Crear, ver, gestionar torneos
4. **Evaluaciones** - Crear evaluaciones trimestrales
5. **Entrenamientos** - Planificar y tomar asistencia

**Evaluación Detail:**
```
Modal:
├─ Alumno: Carlos R.
├─ 6 Habilidades (sliders 1-10):
│  ├─ Derecha: ════●══ (7)
│  ├─ Revés: ═══●═════ (6)
│  ├─ Saque: ══════●─ (8)
│  ├─ Volea: ═══●═════ (6)
│  ├─ Movilidad: ════●══ (7)
│  └─ Slice: ══●════── (5)
├─ Rating calculado: 65/100
├─ Nota: (textarea opcional)
└─ [Guardar] [Sugerir ascenso]
```

**Reglas:**
- Rating = avg(6 habilidades) × 10
- Redondeo matemático
- Ascenso si rating > threshold + XP > mínimo
- Descenso si 2 evaluaciones bajo threshold

---

### Feature: Torneos

**Descripción:**  
Sistema completo de torneo desde creación hasta resultados.

**Tipos de Torneos:**
1. **Eliminación Directa** - Bracket clásico
2. **Round Robin** - Todos vs todos
3. **Grupos + Eliminación** - Fase de grupos luego bracket
4. **Liga** - Formato de liga regular

**Estados del Torneo:**
```
PLANNING → OPEN → IN_PROGRESS → FINISHED → ARCHIVED
```

**Bracket Generation:**
```
Algoritmo:
1. Validar jugadores (mín 4, máx 256)
2. Validar categoría
3. Generar seeding por ranking
4. Crear matches con byes si es necesario
5. Guardar en BD
6. Notificar a jugadores
```

**Puntos de Ranking (por fase):**
```
Interno (×1):
├─ R1: +10 pts
├─ R2: +20 pts
├─ QF: +35 pts
├─ SF: +55 pts
├─ Runner-up: +80 pts
└─ Campeón: +120 pts

Abierto (×1.5):
├─ Todos los anteriores × 1.5
└─ Mínimo +15

Especial (×2):
├─ Todos los anteriores × 2
└─ Máximo multiplicador
```

---

### Feature: White-label

**Descripción:**  
Personalización completa de la marca OPEN para cada club (Premium).

**Customizable:**
- Logo (PNG/SVG)
- Color primario
- Color secundario
- Tipografía (5 opciones)
- Banner del club

**NO Customizable:**
- "Powered by OPEN" (footer)
- T&C y privacy
- Features de seguridad

**Implementación:**
```
CSS Variables dinámicas:
├─ --primary: #2d7a4a
├─ --secondary: #7c3aed
├─ --text: #1f2937
├─ --font-family: 'Poppins'
└─ Cargadas de club_branding table

Logo:
├─ Supabase Storage
├─ Max 2MB
├─ Auto resize a 200px width
└─ Cached 24h
```

---

# 6. ESPECIFICACIONES TÉCNICAS

## 6.1 Tech Stack Confirmado

| Layer | Technology | Justificación |
|---|---|---|
| **Frontend** | React 19 + Vite | Modern, fast, reactive |
| **Styling** | Tailwind CSS | Utility-first, white-label friendly |
| **Mobile** | PWA (Web) → React Native (Fase 6) | Start web, scale native |
| **Backend** | Supabase | PostgreSQL + Auth + RLS built-in |
| **Database** | PostgreSQL | Relational, RLS, proven |
| **Hosting** | Vercel | Next.js ready, auto-deploy, edge functions |
| **Payment** | Stripe + Conekta | Global + LATAM coverage |
| **Analytics** | Vercel Analytics | Built-in, no extra cost |
| **Error Tracking** | Sentry (optional Fase 5+) | Production debugging |

## 6.2 Database Schema (Simplified)

```sql
-- Core Users
users (id, email, name, photo_url, xp, rating, category, club_id, status)
clubs (id, name, location, verified, verified_at, admin_id, plan)
club_members (id, user_id, club_id, role, joined_at)

-- Matches
matches (id, creator_id, rival_id, status, result, xp_credited, created_at)
match_stats (id, match_id, winner_id, set1/2/3, aces, winners, errors, created_at)

-- Tournaments
tournaments (id, club_id, name, status, season, format, created_at)
tournament_entries (id, tournament_id, user_id, seed)
tournament_bracket (id, tournament_id, player1_id, player2_id, winner_id, round)

-- Evaluations
evaluations (id, coach_id, student_id, status, derecha, reves, saque, volea, movilidad, slice, notes, created_at)

-- Training
training_sessions (id, coach_id, club_id, date, time, court, status, created_at)
attendance (id, session_id, user_id, present, marked_at)

-- Achievements
achievements (id, user_id, name, rarity, unlocked_at)
streaks (id, user_id, type, count, last_activity, reset_at)

-- Branding
club_brand_config (id, club_id, logo_url, primary_color, secondary_color, font_family)
```

## 6.3 API Endpoints (Summary)

```
AUTH:
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/reset-password

USERS:
GET    /api/users/me
GET    /api/users/:id
PUT    /api/users/:id
GET    /api/users/:id/xp
GET    /api/users/:id/achievements

CLUBS:
POST   /api/clubs/create
GET    /api/clubs/:id
PUT    /api/clubs/:id
GET    /api/clubs/:id/members
GET    /api/clubs/:id/ranking

MATCHES:
POST   /api/matches/create
GET    /api/matches/:id
PUT    /api/matches/:id/confirm
POST   /api/matches/:id/stats

TOURNAMENTS:
POST   /api/tournaments/create
GET    /api/tournaments/:id
POST   /api/tournaments/:id/bracket
POST   /api/tournaments/:id/result

EVALUATIONS:
POST   /api/evaluations/create
GET    /api/evaluations/:id
PUT    /api/evaluations/:id

PAYMENTS:
POST   /api/subscriptions/create
POST   /api/subscriptions/:id/cancel
GET    /api/subscriptions/:id/status
```

## 6.4 Seguridad

### RLS (Row Level Security)
- ✅ Users: Ver own + club members
- ✅ Matches: Pending = private, confirmed = public
- ✅ Evaluations: Coach = editor, student = read-only
- ✅ XP: User = read-only
- ✅ Clubs: Admin = full control

### Data Validation
- ✅ Frontend: Schema validation (Zod)
- ✅ Backend: Edge function validation
- ✅ Database: Constraints y triggers

### Authentication
- ✅ Supabase Auth (email + Google OAuth)
- ✅ JWT tokens (managed by Supabase)
- ✅ MFA (optional Fase 5+)

---

# 7. FLUJOS DE USUARIO

## 7.1 User Story - Jugador Nuevo

```
Como: Jugador nuevo
Quiero: Empezar a jugar y subir de categoría
Para: Mejorar mis skills y ser reconocido

Criterios de aceptación:
□ Crear perfil en <2 minutos
□ Ver ranking inmediatamente
□ Crear partido en 30 segundos
□ Recibir notificación en vivo

Happy Path:
1. [Descarga app]
2. [Google login]
3. [Completa nombre, foto, edad, categoría]
4. [Busca club, solicita acceso]
5. [Coach aprueba]
6. [Ve perfil con 0 XP]
7. [Tappea "+ Crear Partido"]
8. [Selecciona rival, ingresa resultado]
9. [Rival confirma]
10. [Recibe +50 XP]
11. ✓ Primer logro desbloqueado
```

## 7.2 User Story - Coach Evaluando

```
Como: Coach
Quiero: Evaluar a mis alumnos y ver su progreso
Para: Tomar decisiones informadas de ascenso

Criterios:
□ Abrir evaluación en <30 segundos
□ Ajustar habilidades visualmente
□ Rating calculado automáticamente
□ Sugerir ascenso sin click adicional

Happy Path:
1. [Abre panel de coach]
2. [Tappea en alumno "Carlos"]
3. [Ve perfil + stats]
4. [Tappea "Evaluar"]
5. [Ajusta 6 habilidades con sliders]
6. [Sistema calcula rating: 65/100]
7. [Escribe nota opcional]
8. [Sistema sugiere ascenso (75 > threshold)]
9. [Coach tappea "Promover a Cat B"]
10. [Sistema valida + notifica]
11. ✓ Carlos ascendido
```

## 7.3 User Story - Admin Creando Torneo

```
Como: Admin de Club
Quiero: Crear un torneo con bracket automático
Para: Organizar competencia justa

Criterios:
□ Crear en <3 minutos
□ Bracket generado automáticamente
□ Jugadores pueden inscribirse
□ Resultados se registran en vivo

Happy Path:
1. [Abre app]
2. [Tappea "+ Crear Torneo"]
3. [Nombre: "Open Club 2025"]
4. [Selecciona categorías: B, C, D]
5. [Formato: Eliminación]
6. [Tappea "Crear"]
7. [Abre inscripciones]
8. [16 jugadores se inscriben]
9. [Tappea "Generar Bracket"]
10. [Sistema genera automático]
11. [Notificaciones a todos]
12. ✓ Torneo en progreso
```

---

# 8. MÉTRICAS DE ÉXITO

## 8.1 KPIs Principales (Year 1)

| Métrica | Target | Razón |
|---|---|---|
| **Users Activos** | 2,000 | 50 clubs × 40 users promedio |
| **DAU (Daily)** | 600 | 30% de MAU activos diario |
| **Club Conversión Free→Premium** | 30% | 44 clubs pagando de 146 libres |
| **Ingresos Mensuales** | $112,200 | 44 clubs × $2,550/mes |
| **Churn Rate** | <5%/mes | Retención de clubs |
| **NPS Score** | >50 | Recomendación neta |
| **Uptime** | 99.9% | Confiabilidad |

## 8.2 Métricas por Fase

### Fase 1: POC Player (Semanas 1-8)
- ✅ 80 usuarios (2 clubs)
- ✅ 30 DAU
- ✅ 500+ partidos creados
- ✅ <2s load time
- ✅ 0 bugs críticos

### Fase 2: Coach MVP (Semanas 9-16)
- ✅ 160 usuarios
- ✅ 100 DAU
- ✅ 10 coaches activos
- ✅ 40+ evaluaciones mensuales
- ✅ >4 estrellas en feedback

### Fase 3: Tournaments (Semanas 17-24)
- ✅ 300 usuarios
- ✅ 150 DAU
- ✅ 8 torneos activos
- ✅ 100% bracket generation success
- ✅ <1 bug por sprint

### Fase 4: Admin (Semanas 25-32)
- ✅ 500 usuarios
- ✅ 250 DAU
- ✅ 10 clubs verified
- ✅ Dashboard 95% accuracy
- ✅ 4.2+ NPS

### Fase 5: Monetization (Semanas 33-40)
- ✅ 1,000 usuarios
- ✅ 400 DAU
- ✅ 30% premium conversion
- ✅ $112,200/mes revenue
- ✅ <3% churn

---

# 9. ROADMAP

## 9.1 Cronograma Detallado (2 Años)

### Q1 2025 (FASE 1: POC PLAYER)
**Semanas 1-8 | Objetivo: Player MVP Funcional**

```
Week 1-2: Foundation
├─ Repo setup (React + Supabase)
├─ Auth (email + Google)
├─ Data models
└─ Deployment pipeline

Week 3-4: Player Core
├─ Profile page
├─ Hero card (XP + Rating)
├─ Onboarding flow
└─ Club search & join

Week 5-6: Quick Match
├─ Create match modal
├─ Rival selection
├─ Score input
├─ Confirmation flow

Week 7-8: XP + Ranking
├─ XP calculation
├─ Ranking table
├─ Real-time sync
└─ Testing & bug fixes

Deliverables:
- Deployed app (vercel.app URL)
- 80 beta users (2 clubs)
- 30 DAU
- <2s load time
```

### Q2 2025 (FASE 2: COACH MVP)
**Semanas 9-16 | Objetivo: Coach Panel Completo**

```
Week 9-10: Coach Panel Setup
├─ Tab navigation
├─ Students list
├─ Add/remove students
└─ Student filtering

Week 11-12: Evaluations
├─ Evaluation modal
├─ 6 sliders (habilidades)
├─ Rating calculation
├─ Promotion logic

Week 13-14: Trainings
├─ Create session
├─ Attendance (manual)
├─ XP generation
└─ Session history

Week 15-16: Polish & Scale
├─ Performance optimization
├─ UX refinement
├─ Security audit
└─ Release to 4 clubs

Deliverables:
- Coach panel (5 tabs)
- Evaluation system
- Training management
- 160 users, 100 DAU
```

### Q3 2025 (FASE 3: TOURNAMENTS)
**Semanas 17-24 | Objetivo: Torneo Automático**

```
Week 17-18: Tournament Creation
├─ Tournament model
├─ Create UI
├─ Categorías support
└─ Draft save

Week 19-20: Bracket Generation
├─ Algorithm (elimination)
├─ Seeding by ranking
├─ Byes handling
└─ Visualization

Week 21-22: Tournament Play
├─ Match registration
├─ Score input
├─ Winner advancement
└─ XP + ranking points

Week 23-24: Launch & Optimize
├─ 8 active tournaments
├─ Live bracket updates
├─ Notifications
└─ Bug fixes

Deliverables:
- Full tournament system
- Bracket generation
- Rankings system
- 300+ users
```

### Q4 2025 (FASE 4: ADMIN)
**Semanas 25-32 | Objetivo: Admin Panel**

```
Week 25-26: Admin Dashboard
├─ Overview stats
├─ Member management
├─ Tournament management
└─ Revenue reporting

Week 27-28: Club Verification
├─ Google Places API
├─ Manual verification
├─ Verification status
└─ Escalation flow

Week 29-30: Court Management
├─ Court CRUD
├─ Availability calendar
├─ Reservation system
└─ Status tracking

Week 31-32: Communications
├─ Bulletin system
├─ Birthday notifications
├─ Announcements
└─ Reminders

Deliverables:
- Admin panel (complete)
- Club verification system
- Court management
- Communications tools
- 10 clubs verified
```

### Q1-2 2026 (FASE 5: MONETIZATION)
**Semanas 33-40 | Objetivo: White-label + Payments**

```
Week 33-34: White-label
├─ Brand customization UI
├─ CSS variables
├─ Logo upload
├─ Color picker

Week 35-36: Payments
├─ Stripe integration
├─ Subscription plans
├─ Invoice generation
├─ Webhook handling

Week 37-38: Premium Features
├─ Feature gates
├─ Plan limits
├─ Upgrade flows
└─ Downgrade handling

Week 39-40: Launch Premium
├─ Sales materials
├─ Pricing page
├─ 30% conversion target
└─ Revenue tracking

Deliverables:
- White-label complete
- Payment system
- Premium tier live
- $112,200/month revenue
```

### Q3-4 2026 (FASE 6: NATIVE APPS)
**Semanas 41-60 | Objetivo: iOS + Android**

```
Week 41-50: React Native Setup
├─ Expo init
├─ Navigation structure
├─ Supabase RN
├─ Auth flow

Week 51-60: Feature Parity
├─ All features from web
├─ Native optimizations
├─ App Store submission
├─ Google Play release

Deliverables:
- iOS app (App Store)
- Android app (Google Play)
- Feature parity with web
- Users: 5,000+
```

---

## 9.2 Priorización de Features

### Release 1.0 (MVP)
- ✅ Player profile
- ✅ Quick match
- ✅ XP system
- ✅ Ranking
- ✅ Coach panel (básico)
- ✅ Evaluations

### Release 1.5
- ✅ Achievements
- ✅ Streaks
- ✅ Tournaments
- ✅ Bracket generation

### Release 2.0
- ✅ Admin panel
- ✅ White-label
- ✅ Payments
- ✅ Advanced analytics

### Release 2.5+
- ✅ Native apps
- ✅ Coach marketplace
- ✅ Video analysis
- ✅ Wearables

---

# 10. CONSIDERACIONES ESPECIALES

## 10.1 Problemas Conocidos & Soluciones

| Problema | Solución | Timeline |
|---|---|---|
| **Coaches resistentes a tech** | UX muy simple + training videos | Fase 2 |
| **Datos históricos perdidos** | Migración manual + plantillas | Fase 1 |
| **Conflictos de resultados** | RLS + validación rigurosa | Fase 1 |
| **Churn de clubs** | NPS tracking + soporte activo | Fase 5 |
| **Performance en móvil** | PWA + code splitting | Fase 2 |

## 10.2 Riesgos & Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| **Competencia copia idea** | Media | Alto | Construir comunidad rápido, mejorar constantemente |
| **Regulación deportiva** | Baja | Medio | Consultar con federaciones, terms claros |
| **Churn alto de usuarios** | Media | Alto | NPS tracking, features de engagement |
| **Falta de monetización** | Baja | Crítica | MVP premium desde Fase 5 |
| **Tech debt acumula** | Alta | Alto | Code reviews, refactor plans cada quarter |

## 10.3 Dependencias Externas

```
✓ Supabase API: Uptime 99.9%+
✓ Vercel Hosting: Auto-scaling
✓ Google Places API: Para verificación
✓ Stripe API: Pagos globales
✓ Conekta API: Pagos LATAM
✗ Ninguna dependencia crítica única
```

## 10.4 Consideraciones Legales (LATAM)

### GDPR/Privacy
- ✅ Política de privacidad clara
- ✅ Consentimiento de datos
- ✅ Derecho a eliminar datos
- ✅ Data residency (México preferentemente)

### Términos de Servicio
- ✅ Responsabilidad limitada
- ✅ Disclaimer: no responsables por resultados
- ✅ Resolución de disputas
- ✅ Jurisdicción: Estado de México

### Datos Deportivos
- ⚠️ Rankings públicos OK (datos de usuario)
- ⚠️ Confirmar con federaciones locales
- ⚠️ No usar logos federativos sin permiso

---

# 11. APÉNDICES

## 11.1 Glosario

| Término | Definición |
|---|---|
| **XP** | Experience Points - Puntos ganados por actividad |
| **Rating** | Evaluación numérica (0-100) de habilidad |
| **Racha** | Streak - Actividad consecutiva |
| **RLS** | Row Level Security - Seguridad a nivel fila en BD |
| **White-label** | Plataforma rebrandeable |
| **MVP** | Minimum Viable Product |
| **DAU** | Daily Active Users |
| **MAU** | Monthly Active Users |
| **NPS** | Net Promoter Score |
| **TTL** | Time To Live - Expiración de caché |

## 11.2 Referencias

- [Supabase Docs](https://supabase.com/docs)
- [React 19 Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Vercel Docs](https://vercel.com/docs)
- [Stripe Docs](https://stripe.com/docs)

## 11.3 Historiales de Cambios

### v4.0 (Actual - Abril 2025)
- ✅ Spec completo consolidado
- ✅ Todas las fases definidas
- ✅ Roadmap detallado
- ✅ Diagrama de features

### v3.5 (Marzo 2025)
- Agregadas rachas
- Agregados logros
- White-label diseño

### v3.0 (Febrero 2025)
- MVP definido
- Usuarios personas

---

# 12. SIGN-OFF

**Documento Aprobado Por:**

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| Founder/CEO | [Tu Nombre] | _______ | Abr 2025 |
| Lead Dev | [Si aplica] | _______ | - |
| Product Lead | [Si aplica] | _______ | - |

---

**FIN DEL DOCUMENTO**

*Este PRD es un documento vivo. Será actualizado en cada fase.*  
*Última revisión: Abril 27, 2025*

