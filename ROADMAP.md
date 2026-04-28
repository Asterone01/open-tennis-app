# OPEN — Complete Product Specification v4.0

## Document Maestro Unificado

**Clasificación:** Interno — Confidencial  
**Versión:** 4.0 — Master Complete  
**Última actualización:** Abril 2025  
**Estado:** Listo para desarrollo  
**Audiencia:** Developers, Founders, Investors, Stakeholders

---

# 📋 TABLA DE CONTENIDOS COMPLETA

**SECCIÓN 1:** Visión, Propósito y Mercado  
**SECCIÓN 2:** Perfiles de Usuario y Onboarding  
**SECCIÓN 3:** Sistema de Categorías y Edades  
**SECCIÓN 4:** XP, Rating y Gamificación  
**SECCIÓN 5:** Sistema de Logros (Achievements)  
**SECCIÓN 6:** Sistema de Rachas (Streaks)  
**SECCIÓN 7:** Asistencia a Entrenamientos  
**SECCIÓN 8:** Partidos Amistosos — Flujos Exactos  
**SECCIÓN 9:** Torneos Estacionales con Trofeos Digitales  
**SECCIÓN 10:** Perfil del Jugador — Especificación Visual y Funcional  
**SECCIÓN 11:** Perfil del Coach — Features y Flujos  
**SECCIÓN 12:** Panel del Administrador — Dashboard y Gestión  
**SECCIÓN 13:** White-label, Personalización y Monetización  
**SECCIÓN 14:** Stack Tecnológico Completo  
**SECCIÓN 15:** Estructura de Base de Datos (Schema PostgreSQL)  
**SECCIÓN 16:** API Endpoints y Contratos Backend  
**SECCIÓN 17:** Modelos de Datos (TypeScript)  
**SECCIÓN 18:** Seguridad, Autenticación y RLS Policies  
**SECCIÓN 19:** Estados, Transiciones y State Machines  
**SECCIÓN 20:** Notificaciones — Matriz Completa  
**SECCIÓN 21:** Casos de Error y Edge Cases  
**SECCIÓN 22:** Cálculos, Fórmulas y Lógica Exacta  
**SECCIÓN 23:** Performance, Escalabilidad e Índices  
**SECCIÓN 24:** User Flows y Wireframes (Descripciones)  
**SECCIÓN 25:** Roadmap de Despliegue Detallado  
**SECCIÓN 26:** Estimación de Costos  
**SECCIÓN 27:** Reglas de Negocio Críticas (24 Rules)  
**SECCIÓN 28:** Plan de Testing y QA  
**SECCIÓN 29:** Roadmap Técnico (Tech Debt y Mantenimiento)  
**SECCIÓN 30:** Guía de Estilo de Código  
**SECCIÓN 31:** Backlog y Futuras Expansiones  
**SECCIÓN 32:** Preguntas Clave de Validación

---

# SECCIÓN 1: VISIÓN, PROPÓSITO Y MERCADO

## 1.1 Definición del Producto

OPEN es la infraestructura que elimina la fricción en la organización del tenis amateur a profesional. Conecta jugadores, coaches, clubs y administradores en un único sistema donde pueden:

- Organizar partidos sin caos operativo
- Gestionar entrenamientos con asistencia automática
- Competir en torneos internos y abiertos
- Medir progreso a través de XP, Rating y logros

**Tagline:** Play. Improve. Connect.

## 1.2 Propuestas de Valor

|Rol|Propuesta|
|---|---|
|**Jugador**|Descubre rivales, mide progreso, gana logros, compite en torneos|
|**Coach**|Gestiona alumnos, evaluaciones automáticas, genera XP sin trabajo manual|
|**Club**|Centraliza socios, canchas, torneos, reservas, comunicación|
|**OPEN (negocio)**|Modelo freemium escalable, SaaS, marketplace futuro|

## 1.3 Mercado Inicial

- **Geografía:** Estado de México
- **Clubs piloto:** 2 clubs de ~40 personas cada uno (80 usuarios)
- **Perfil:** Todos los rangos de edad (Junior 6-12, Juvenil 13-17, Adulto 18-50, Senior 50+)
- **Horizonte:** Todo México en 12 meses

---

# SECCIÓN 2: PERFILES DE USUARIO Y ONBOARDING

## 2.1 Cuatro Roles de Usuario

```
┌──────────────┬──────────────────────────┬──────────────────┐
│ Rol          │ Descripción              │ Tabs que ve      │
├──────────────┼──────────────────────────┼──────────────────┤
│ Jugador      │ Usuario base             │ Perfil, Jugadores│
│              │                          │ Ranking          │
├──────────────┼──────────────────────────┼──────────────────┤
│ Coach        │ Jugador + gestor alumnos │ Tabs anteriores + │
│              │                          │ Alumnos, Eval,   │
│              │                          │ Entrenos, Torneos│
├──────────────┼──────────────────────────┼──────────────────┤
│ Admin Club   │ Gestor del club          │ Dashboard web    │
│              │                          │ Panel app        │
├──────────────┼──────────────────────────┼──────────────────┤
│ Invitado     │ Usuario temporal         │ Solo 1 torneo    │
│              │ para torneos externos    │ Acceso limitado  │
└──────────────┴──────────────────────────┴──────────────────┘
```

## 2.2 Flujo de Onboarding — 6 Pantallas

### Pantalla 1: Bienvenida

```
┌─────────────────────────────┐
│          OPEN               │
│  Play. Improve. Connect.    │
│                             │
│  ¿Eres jugador o coach?     │
│                             │
│  [Jugador]  [Coach]         │
└─────────────────────────────┘
```

### Pantalla 2: Crear Cuenta

```
Correo / Google Sign-In / Apple Sign-In
Contraseña (si email)
Aceptar términos
[Siguiente]
```

### Pantalla 3: Perfil Básico

```
Nombre (requerido)
Foto de perfil (opcional)
Edad (requerido)
Teléfono (opcional)
[Siguiente]
```

### Pantalla 4: Grupo de Edad

```
¿En qué grupo estás?
[Junior 6-12] [Juvenil 13-17] [Adulto 18-50] [Senior 50+]
[Siguiente]
```

### Pantalla 5: Categoría de Nivel

```
¿Cuál es tu nivel de tenis?
[D - Iniciación] [C - Básico] [B - Intermedio] 
[A - Avanzado] [Pro - Élite]
(Sugerencia; coach puede cambiar)
[Siguiente]
```

### Pantalla 6: Unirse a Club

```
[Buscar club por nombre...]
O
[Escanear QR del club]

Una vez encontrado:
"Club Tenis Norte"
[Solicitar acceso] / [Unirse con código]

Admin debe aprobar.
[Siguiente]
```

### Pantalla 7: Tour de Features (Opcional pero recomendado)

**Slide 1:**

```
🏆 RANKING
"Compite con otros jugadores de tu categoría
en tu club. Solo los torneos cuentan."
```

**Slide 2:**

```
⚡ EXPERIENCIA
"Gana XP en entrenamientos, partidos y torneos.
Nunca bajan. Suma de por vida."
```

**Slide 3:**

```
🎖️ LOGROS
"Desbloquea medallas y rachas por tu actividad.
Comparte en Instagram y Twitter."
```

**Resultado:** Usuario en su perfil viendo XP=0, sin rating aún, esperando que coach lo asigne a categoría.

---

# SECCIÓN 3: SISTEMA DE CATEGORÍAS Y EDADES

## 3.1 Categorías de Nivel (Asignadas por coach)

|Código|Nombre|Descripción|
|---|---|---|
|**D**|Iniciación|Nunca jugó o < 3 meses|
|**C**|Básico|Conoce reglas, algo consistente|
|**B**|Intermedio|Juega partidos, técnica reconocible|
|**A**|Avanzado|Torneos locales, técnica sólida|
|**Pro**|Élite|Nivel federado, región+|

La categoría es asignada por el coach. El jugador sugiere al registrarse pero coach la confirma.

## 3.2 Grupos de Edad (Seleccionados por jugador)

|Código|Rango|Descripción|
|---|---|---|
|**Junior**|6-12|Niños en iniciación|
|**Juvenil**|13-17|Adolescentes en desarrollo|
|**Adulto**|18-50|Adultos activos|
|**Senior**|50+|Veteranos|

**Impacto en el producto:**

- Badge visible: "Cat. B · Adulto"
- Ranking separado por edad + categoría (Ej: Cat. B Adultos vs Cat. B Juveniles)
- App sugiere rivales según rango de edad
- Comunicación personalizada por edad

---

# SECCIÓN 4: XP, RATING Y GAMIFICACIÓN

## 4.1 Los Dos Números del Jugador

### XP — Experiencia

- Acumulativo de por vida
- Global (cross-club)
- Gamificable y social
- Nunca baja
- No determina ranking de torneos

**Fórmula:** XP Total = Σ XP de todas las actividades

### Rating — Nivel Técnico

- Promedio de 6 habilidades × 10
- Escala 1-100
- Solo comparable en misma categoría
- Por club (independiente si pertenece a varios)
- Actualizado cada trimestre por coach

**Fórmula:**

```
Rating = (Derecha + Revés + Saque + Volea + Movilidad + Slice) / 6 × 10
```

**Ejemplo:**

```
Derecha: 7
Revés: 5
Saque: 7
Volea: 4
Movilidad: 7
Slice: 6
─────────
Suma: 36
Rating: 36 / 6 × 10 = 60 / 100
```

## 4.2 Tabla Completa de XP

### XP por Entrenamientos

|Acción|XP|Notas|
|---|---|---|
|Asistir a entrenamiento|+50|Se acredita al cerrar sesión|
|Racha 3 entrenamientos|+50 bonus|Adicional a los +50|
|Racha 5 entrenamientos|+75 bonus|Acumulativo|
|Racha 10 entrenamientos|+100 bonus|Acumulativo|

**Total máximo Entrenamiento:**

```
Asistir (50) + Racha 3 (50) + Racha 5 (75) + Racha 10 (100) = 275 XP en un día
Pero solo si rompes 3 , 5 y 10 rachas el mismo día (muy raro)
Típicamente: 50 XP/sesión
```

### XP por Partidos Amistosos

|Acción|XP|Notas|
|---|---|---|
|Jugar (cualquier resultado)|+30|Sin confirmación = 0|
|Ganar (confirmado)|+20 adicional|Total: 50|
|Perder (confirmado)|+10 adicional|Total: 40|
|Con juez en vivo|+15 adicional|Se suma a ganar/perder|

**Ejemplos:**

```
Pierdes sin juez: 30 + 10 = 40 XP
Ganas sin juez: 30 + 20 = 50 XP
Ganas con juez: 30 + 20 + 15 = 65 XP
Pierdes con juez: 30 + 10 + 15 = 55 XP

En dobles: Mismos XP a los 4 jugadores
```

### XP por Torneos (Acumulativos por fase)

|Fase|XP fase|XP acumulado|
|---|---|---|
|Primera ronda (participar)|+80|80|
|Segunda ronda|+40|120|
|Cuartos de final|+60|180|
|Semifinal|+80|260|
|Final (subcampeón)|+100|360|
|Campeón|+200|560|

**Regla importante:** Si pierdes en 1ra ronda igual recibes +80 XP. El sistema premia participar.

---

# SECCIÓN 5: SISTEMA DE LOGROS (ACHIEVEMENTS / MEDALLAS)

## 5.1 Concepto

Son medallas digitales desbloqueables por cumplir condiciones específicas. Son:

- **Coleccionables** — el jugador acumula
- **Compartibles** — Instagram, Twitter, WhatsApp
- **Permanentes** — archivadas en perfil para siempre
- **Visualmente únicas** — cada una con icono y rareza

Cada logro tiene:

- Nombre (ej. "Campeón")
- Descripción (ej. "Gana un torneo")
- Condición (ej. "Posición final = 1")
- Icono único
- Rareza (Común, Plata, Oro)
- Fecha de desbloqueo

## 5.2 Catálogo de 20+ Logros

### Logros de Actividad

|Logro|Condición|Rareza|
|---|---|---|
|**Primer Paso**|Juega 1er partido|Común|
|**Entrenador Comprometido**|Asiste 5 entrenamientos seguidos|Plata|
|**Máquina de Entrenos**|Asiste 20 entrenamientos en un mes|Oro|
|**Debutante en Torneos**|Participa en 1er torneo|Común|
|**Tornamentista**|Participa en 3 torneos|Plata|
|**Campeón**|Gana 1er torneo|Oro|
|**Tricampeón**|Gana 3 torneos|Oro|

### Logros de Racha

|Logro|Condición|Rareza|
|---|---|---|
|**Ganador**|3 victorias seguidas|Plata|
|**Racha Legendaria**|10 victorias seguidas|Oro|
|**Perseverante**|Pierde y juega otro en 24h|Común|
|**Resiliencia**|Pierde y ganas 5 seguidos después|Plata|

### Logros de Progreso

|Logro|Condición|Rareza|
|---|---|---|
|**Promesa**|Cat. D → C|Plata|
|**En Ascenso**|Cat. C → B|Plata|
|**Elite Confirmada**|Cat. B → A|Oro|
|**Profesional**|Cat. A → Pro|Oro|

### Logros de Estadísticas

|Logro|Condición|Rareza|
|---|---|---|
|**Ace Master**|100 aces en partidos con juez|Plata|
|**Golden Arm**|50 winners en un mes|Plata|
|**Precisión**|Err. NF < 20% en mes|Oro|

### Logros de Comunidad

|Logro|Condición|Rareza|
|---|---|---|
|**Gregario**|Juega 3 rivales distintos|Común|
|**Mentor**|Alumno tuyo sube de categoría|Plata|
|**Reclutador**|3 amigos se unen a OPEN|Plata|

## 5.3 Desbloqueo Automático

Al cumplir la condición:

1. Sistema detecta automáticamente
2. Push notification: "🎖️ ¡Desbloqueaste Campeón!"
3. Medalla aparece en perfil
4. Usuario puede compartir en redes

No requiere aprobación manual.

## 5.4 Visualización en Perfil

**Sección "Medallas":**

```
Desbloqueadas (rellenas - negras):
🎖️ 🎖️ 🎖️ 🎖️
Primer  Entrenador  Ganador  Promesa
Paso   Comprometido

Bloqueadas (grises - aspiracionales):
🔒 🔒 🔒 🔒
Elite      Racha      Campeón   Ace
Confirmada Legendaria          Master
```

Al tocar una:

```
┌──────────────────────────────┐
│  🎖️ ENTRENADOR COMPROMETIDO  │
│                              │
│ Rareza: PLATA                │
│ Desbloqueada: 15 Abr 2025   │
│                              │
│ Condición: Asiste a 5        │
│ entrenamientos seguidos       │
│                              │
│ [Compartir en Instagram]     │
│ [Compartir en Twitter]       │
│ [Compartir en WhatsApp]      │
└──────────────────────────────┘
```

---

# SECCIÓN 6: SISTEMA DE RACHAS (STREAKS)

## 6.1 Concepto

Una racha es un contador de eventos consecutivos. Se incrementa mientras se cumpla la condición. Se resetea INMEDIATAMENTE al fallar.

### Estructura de Racha

```javascript
{
  streak_type: "training_attendance",    // tipo
  current_count: 5,                      // contador actual
  max_record: 12,                        // mejor récord
  last_activity_date: "2025-04-27",     // última vez que se incrementó
  status: "active" | "broken",          // estado
  reset_date: null,                      // cuándo se rompió (si aplica)
  fire_emoji: true                       // 🔥 si >= 3
}
```

## 6.2 Cinco Tipos de Rachas

### 6.2.1 Racha de Entrenamientos

```
Definición: Días consecutivos con ≥1 asistencia

Incremento: +1 cada día que asistes
Falla: Un día sin asistencia = resetea a 0
Visual: 🔥 si >= 3
Impacto: Contribuye a logro "Máquina de Entrenos"

Ejemplo:
Lun: Asistes → racha = 1
Mar: Asistes → racha = 2
Mié: Asistes → racha = 3 (🔥 aparece)
Jue: NO asistes → racha = 0 (🔥 desaparece)
Vie: Asistes → racha = 1 (reinicia)
```

### 6.2.2 Racha de Victorias en Amistosos

```
Definición: Partidos amistosos ganados consecutivos

Incremento: +1 cada victoria confirmada
Falla: Una derrota confirmada = resetea a 0
Visual: 🔥 si >= 3
Impacto: Contribuye a logro "Ganador"
Ranking especial: Tabla pública del club

Ejemplo:
Lun: Ganas 6-4, 6-3 → racha = 1
Mar: Ganas 7-5, 6-4 → racha = 2
Mié: Ganas 6-4, 7-6 → racha = 3 (🔥)
Jue: PIERDES 4-6, 3-6 → racha = 0
Vie: Ganas 6-3, 6-2 → racha = 1
```

### 6.2.3 Racha de Derrotas Consecutivas

```
Definición: Partidos amistosos perdidos consecutivos

Incremento: +1 cada derrota confirmada
Falla: Una victoria confirmada = resetea a 0
Visual: 🛡️ badge "Resiliencia" después de ganar
Impacto: No penaliza; muestra contexto en evaluación

Ejemplo:
Lun: PIERDES → racha = 1
Mar: PIERDES → racha = 2
Mié: PIERDES → racha = 3
Jue: GANAS → racha = 0 + [🛡️ Resiliencia desbloqueada]
```

### 6.2.4 Racha de Títulos en Torneos

```
Definición: Torneos ganados consecutivos en un año

Incremento: +1 cada campeonato ganado
Falla: No ganar un torneo disponible = resetea a 0
Visual: 👑 si >= 2
Impacto: Ranking "Top 5 Campeonistas"

Ejemplo:
Copa Primavera: GANAS → racha = 1
Clásico Verano: GANAS → racha = 2 (👑)
Torneo Otoño: NO participas por lesión → racha = 0
```

### 6.2.5 Racha de Partidos Jugados (Cualquier tipo)

```
Definición: Cualquier partido (amistoso + torneo) jugado en días consecutivos

Incremento: +1 cada día que juegas un partido
Falla: Un día sin jugar = resetea a 0
Visual: ⚡ si >= 7
Impacto: Muestra actividad general

Ejemplo:
Lun: Juega amistoso → racha = 1
Mar: Juega torneo → racha = 2
Mié: Juega amistoso → racha = 3
Jue: Juega entrenamiento (NO cuenta) → racha = 0
Vie: Juega amistoso → racha = 1
```

## 6.3 Ranking Público de Rachas del Club

Tabla visible en la sección "Ranking" del club:

```
RACHAS ACTIVAS DEL CLUB
────────────────────────────────────
Entrenamientos (Días consecutivos):
1. Carlos R.        🔥 12 días
2. Sofia T.         🔥 8 días
3. Juan G.          🔥 6 días

Victorias en Amistosos (Partidos seguidos):
1. Maria L.         🔥 7 victorias
2. Pedro M.         🔥 4 victorias

Títulos Ganados (Torneos seguidos):
1. Ana G.           👑 2 títulos

Partidos Jugados (Días consecutivos):
1. Carlos R.        ⚡ 9 días
2. Sofia T.         ⚡ 5 días
```

Esta tabla actualiza diariamente y **genera competencia sana**. Los jugadores quieren mantener su racha visible.

---

# SECCIÓN 7: ASISTENCIA A ENTRENAMIENTOS

## 7.1 Registro Manual por Coach (Sistema Elegido)

### Proceso Step-by-Step

```
1. Coach planifica sesión en OPEN
   ├─ Título: "Saque y Volea"
   ├─ Fecha: 28 Abr
   ├─ Hora: 18:00
   ├─ Cancha: Pista 2
   ├─ Categorías: B, C
   ├─ Selecciona alumnos: [multiselect]
   └─ [CREAR]
   
   → Todos los convocados reciben PUSH: 
     "Sesión de entrenamiento mañana a las 18:00"

2. Durante la sesión: Coach anota quién asiste

3. Al terminar, coach abre la sesión en OPEN
   Sistema muestra lista:
   
   ✓ Carlos R.
   ✓ Sofia T.
   ○ Juan G.
   ✓ Maria L.
   ○ Pedro M.
   
   Coach tappea nombres para toggle presente/ausente

4. Coach confirma: "CERRAR SESIÓN"
   → +50 XP automático a cada presente (Carlos, Sofia, Maria)
   → Notificación push a cada uno
   → Registro es INMUTABLE (no editable después)
```

### Por qué este sistema

- Muy simple de implementar
- Perfecto para clubs pequeños (40-80 personas)
- No requiere smartphone para todos
- Funciona incluso en entrenamientos al aire libre
- Genera confianza en comunidades pequeñas

### Nota: Escalabilidad Futura

En Fase 3+ cuando el club tenga 100+ jugadores, se puede agregar validación con QR como capa adicional. Por ahora, el registro manual es suficiente y mucho más práctico.

---

# SECCIÓN 8: PARTIDOS AMISTOSOS — FLUJOS EXACTOS

## 8.1 Modalidad 1: Registro Rápido (Post-Partido)

### Flujo de Usuario

```
Jugador A abre la app después de jugar.

[Crear Partido]
├─ Tipo: [Singles] o [Dobles]
├─ Rival: [buscar nombre del jugador]
├─ Compañero: [solo si dobles]
├─ Fecha: [date picker]
├─ Cancha: [texto libre, ej. "Pista 2 de Club Tenis Norte"]
├─ Duración estimada: [1h 30min]
├─ Resultado:
│  ├─ Set 1: [6] VS [4]
│  ├─ Set 2: [3] VS [6]
│  └─ Set 3: [7] VS [5] (opcional)
└─ [CREAR PARTIDO]
```

### Flujo Anti-Trampa

```
PASO 1: Jugador A registra y hace submit
  → Partido entra en estado "PENDIENTE_CONFIRMACION"
  → XP no se acredita aún
  → Datos quedan guardados en BD

PASO 2: Sistema envía PUSH a Jugador B
  Push dice: "Carlos registró un partido contigo.
             ¿Confirmas el resultado 6-4, 3-6?"

PASO 3: Jugador B abre la notificación
  Ve el partido con los datos exactos:
  - Rival: Carlos
  - Fecha: 25 Abr 2025
  - Resultado: 6-4, 3-6
  - Duración: 1h 30min

PASO 4: Jugador B elige:

  OPCIÓN A: [CONFIRMAR]
    → Partido pasa a CONFIRMADO
    → XP acreditados INMEDIATAMENTE a ambos:
       ├─ Carlos: +50 XP (30 por jugar + 20 por ganar)
       └─ Sofia: +40 XP (30 por jugar + 10 por perder)
    → Notificación push a Carlos: "✅ Sofia confirmó tu partido"
    → Ambos ven el partido en su historial

  OPCIÓN B: [DISPUTAR MARCADOR]
    → Abre un campo para escribir el marcador correcto
    → Ejemplo: Escribe "6-3, 6-4"
    → Envía PUSH a Carlos: "Sofia cuestiona el resultado.
                           Propone: 6-3, 6-4. ¿Aceptas?"
    → Carlos puede:
       * Aceptar la corrección → Partido confirmado con nuevo marcador
       * Insistir en su versión → Negocia
       * Si no hay acuerdo en 24h → Partido cancelado, sin XP

  OPCIÓN C: [RECHAZAR]
    → Partido se cancela
    → Sin XP para nadie
    → Notificación a Carlos: "Sofia rechazó tu partido"
    → Carlos puede crear uno nuevo

PASO 5: Si Jugador B NO responde en 48 horas
  → Partido queda en estado PENDIENTE_EXPIRADO
  → Sin XP para nadie
  → Notificación a ambos: "Tiempo para confirmar expiró"
```

### Límite Anti-Spam

```
Máximo 3 partidos PENDIENTES de confirmación por jugador
Si intenta crear el 4to → Error: "Tienes 3 partidos pendientes.
Espera a que se confirmen o rechacen antes de crear otro."
```

### Tabla de Estados

|Estado|Duración|XP acreditados|
|---|---|---|
|PENDIENTE_CONFIRMACION|Hasta 48h|No|
|DISPUTADO|Negocia|No|
|CONFIRMADO|Permanente|Sí|
|RECHAZADO|Permanente|No|
|PENDIENTE_EXPIRADO|48h+|No|

---

## 8.2 Modalidad 2: En Vivo con Juez

### Quién Puede Ser Juez

**Respuesta:** Cualquier usuario de OPEN.

- No requiere rol especial
- No requiere certificación
- Puede ser otro jugador, coach, o cualquiera

### Flujo de Usuario

```
PASO 1: Coach crea el partido en OPEN

[Crear Partido con Juez]
├─ Tipo: [Singles] o [Dobles]
├─ Jugador 1: [buscar]
├─ Jugador 2: [buscar]
├─ Compañeros (si dobles): [buscar]
├─ Fecha: [date picker]
├─ Hora: [time picker]
├─ Cancha: [texto libre]
├─ Juez: [buscar usuario por nombre]
│         (campo opcional pero RECOMENDADO)
└─ [CREAR PARTIDO EN VIVO]

Sistema envía PUSH a:
├─ Jugador 1: "Tu partido comienza en 30 min. Juez: Carlos"
├─ Jugador 2: "Tu partido comienza en 30 min. Juez: Carlos"
└─ Juez Carlos: "Te han asignado como juez.
                 [Ir al partido]"

PASO 2: Juez abre la app antes del partido

Pantalla del juez (EXCLUSIVA):
┌─────────────────────────────────┐
│  JUEZ — En Vivo                 │
│  ─────────────────────────────  │
│  Carlos R.    VS    Sofia T.    │
│  Cat. B · Adulto | Singles      │
├─────────────────────────────────┤
│  Set 1 · Game 3 · 30 - 15      │
├─────────────────────────────────┤
│  [PUNTO CARLOS]  [PUNTO SOFIA]  │
│  [DESHACER PUNTO]               │
├─────────────────────────────────┤
│  Estadísticas                   │
│         Carlos      Sofia       │
│  Aces   [+] 2       3 [+]       │
│  Winners[+] 5       4 [+]       │
│  D.Falta[+] 0       1 [+]       │
│  Err.Forz[+] 2      3 [+]       │
│  Err.NF [+] 4       5 [+]       │
│  Pts Fav:   30              15  │
│  Pts Con:   15              30  │
└─────────────────────────────────┘

PASO 3: Durante el partido

Juez:
├─ Tappea [PUNTO CARLOS] cada vez que Carlos gana un punto
├─ Tappea [PUNTO SOFIA] cada vez que Sofia gana
├─ Sistema actualiza:
│  ├─ Marcador (15, 30, 40, Juego)
│  ├─ Estadísticas en tiempo real
│  └─ Ambos jugadores ven actualizaciones push cada game
└─ Si se equivoca, tappea [DESHACER PUNTO]

PASO 4: Juez finaliza el partido

Al terminar el último set:
├─ [CERRAR PARTIDO]
│  → Sistema genera resumen:
│     ├─ Marcador final: 6-4, 7-5
│     ├─ Ganador: Carlos R.
│     ├─ Duración: 1h 45min
│     └─ Estadísticas completas
│
└─ Resumen se envía a ambos jugadores:
   "¿Confirmas el resultado? [CONFIRMAR] [RECHAZAR]"

PASO 5: Confirmación de ambos

Si AMBOS confirman:
├─ XP acreditados:
│  ├─ Carlos: +50 (30+20) + 15 (juez) = 65 XP
│  └─ Sofia: +40 (30+10) + 15 (juez) = 55 XP
├─ Estadísticas guardadas al historial:
│  ├─ Aces: Carlos 2, Sofia 3
│  ├─ Winners: Carlos 5, Sofia 4
│  └─ Etc.
└─ Notificación: "✅ Partido confirmado. +65 XP"

Si ALGUNO rechaza:
├─ Partido se cancela
├─ Sin XP para nadie
├─ Estadísticas NO se guardan
└─ Notificación: "❌ Partido fue rechazado"
```

### Las 6 Estadísticas que Registra el Juez

|Estadística|Definición|
|---|---|
|**Aces**|Saque directo sin que rival toque|
|**Winners**|Golpe ganador sin que rival devuelva|
|**Dobles Faltas**|Dos faltas consecutivas en un punto|
|**Errores Forzados**|Error provocado por presión rival|
|**Errores No Forzados**|Error sin presión del rival|
|**Puntos a favor / en contra**|Calculado automáticamente|

---

# SECCIÓN 9: TORNEOS ESTACIONALES CON TROFEOS DIGITALES

## 9.1 Las 4 Temporadas y Sus Temas

|Temporada|Período|Color|Tema|Ejemplo|
|---|---|---|---|---|
|**Primavera**|Mar-May|Verde #2d7a4a|Renacimiento|Copa Primavera|
|**Verano**|Jun-Ago|Naranja #f5a623|Energía|Clásico de Verano|
|**Otoño**|Sep-Nov|Naranja #e67e22|Madurez|Torneo de Otoño|
|**Invierno**|Dic-Feb|Azul #3498db|Resistencia|Desafío Invierno|

## 9.2 Interfaz Visual por Temporada

Cada torneo muestra:

```
┌─────────────────────────────────────┐
│       🌸 COPA PRIMAVERA 🌸         │ ← Banner temático
│       (verde, flores)               │
│                                     │
│   Club Tenis Norte                 │
│   Primavera 2025                   │
│   12 Mayο - 2 Junio                │
│                                     │
│   ├─ Categorías: B · C             │
│   ├─ 16 jugadores inscritos        │
│   ├─ Formato: Eliminación Directa  │
│   ├─ Genera ranking: Sí            │
│   └─ Multiplicador: ×1             │
│                                     │
│   [Ver Bracket] [Inscribirse]      │
└─────────────────────────────────────┘
```

## 9.3 Configuración del Torneo por el Coach

```
[Crear Torneo]
├─ Nombre: "Copa Primavera 2025"
├─ Temporada: [Primavera / Verano / Otoño / Invierno]
├─ Tipo: [Interno / Abierto]
├─ Fechas:
│  ├─ Inicio: [date picker]
│  └─ Fin: [date picker]
├─ Categorías: [checkboxes] B · C
│  (puede ser múltiple)
├─ Formato: [Eliminación / Round Robin / Grupos]
├─ Límite de jugadores: [16 / 32 / 64 / custom]
├─ ¿Genera puntos de ranking oficial?: [Sí / No]
├─ Multiplicador de ranking: [×1 / ×1.5 / ×2]
├─ Banner personalizado: [subir imagen]
├─ Descripción: [editor de texto]
└─ [CREAR TORNEO]
```

## 9.4 Flujo Completo de Torneo

```
FASE 1: CREACIÓN
├─ Coach crea torneo con parámetros
├─ Sistema genera visual temático
└─ Aparece en el club con banner colorido

FASE 2: INSCRIPCIONES
├─ Jugadores ven torneo y [Inscribirse]
├─ Coach ve contador: 8/16 inscritos
├─ Coach puede agregar jugadores manualmente
└─ Coach cierra inscripciones cuando quiera

FASE 3: GENERACIÓN DE BRACKET
├─ Coach tappea [Cerrar inscripciones]
├─ Sistema genera bracket automáticamente
│  ├─ Algoritmo: random/balanceado por rating
│  └─ Guarda tree de matchups
├─ Todos ven el bracket
└─ Bracket es inmutable (no se puede cambiar)

FASE 4: EN CURSO - Resultados partido a partido
├─ Coach (o jugadores, según config):
│  ├─ Registra resultado de cada partido
│  ├─ Sistema actualiza bracket en tiempo real
│  └─ XP se acreditan INMEDIATAMENTE
├─ Otros pueden ver el avance en vivo
└─ Duración: días o semanas

FASE 5: FINALIZADO
├─ Último partido se juega
├─ Sistema detecta campeón
├─ XP acreditados:
│  ├─ Campeón: +560 XP (80+40+60+80+100+200)
│  ├─ Subcampeón: +360 XP
│  └─ Otros según fase donde cayeron
├─ Puntos de ranking acreditados (con multiplicador)
├─ Trofeos digitales generados y archivados
├─ Notificaciones push a todos
└─ Torneo pasa a estado ARCHIVADO

FASE 6: ARCHIVO
├─ Torneo visible pero no editable
├─ Puedes ver bracket, resultados, stats
├─ Ganador tiene trofeo digital permanente
└─ Aparece en historial del club
```

---

# SECCIÓN 10: TROFEOS DIGITALES Y ACTIVOS DE USUARIO

## 10.1 Concepto del Trofeo Digital

Cada torneo ganado genera un **trofeo único** que:

- Es **personalizable** por el campeón
- Aparece **archivado en el perfil** para siempre
- Puede **compartirse en redes sociales**
- Es un **activo digital** (similar a ticket de evento, NO es NFT)

## 10.2 Anatomía del Trofeo Digital

```
┌──────────────────────────────────┐
│        🏆 CAMPEÓN 🏆             │
│    Copa Primavera 2025           │
│    Club Tenis Norte              │
│                                  │
│  Ganador: Carlos Rodriguez       │
│  Categoría: B · Adulto           │
│  Fecha: 2 de Junio, 2025         │
│                                  │
│  ┌────────────────────────────┐  │
│  │ "¡Campeón inquebrantable!" │  │ ← Frase personalizada
│  └────────────────────────────┘  │     (máx 50 caracteres)
│                                  │
│  [Compartir]  [Descargar]        │
└──────────────────────────────────┘
```

## 10.3 Componentes del Trofeo

### Fijos (Generados por OPEN)

- Diseño visual del trofeo (varía por temporada)
- Nombre del torneo
- Club
- Fecha
- Categoría y grupo de edad del jugador

### Personalizables (Por el ganador)

- Frase personalizada (máx 50 caracteres)
- Color de fondo (paleta predefinida)
- Incluir foto del jugador (sí/no)

## 10.4 Compartir en Redes

```
[Compartir Trofeo]
├─ [Instagram] 
│  ├─ Abre generador de imagen
│  └─ Usuario elige qué compartir
│
├─ [Twitter/X]
│  ├─ Texto automático:
│  │  "🏆 ¡Campeón de Copa Primavera 2025!
│  │   Club Tenis Norte @OPEN_tennis"
│  └─ Incluye URL del trofeo
│
├─ [WhatsApp]
│  ├─ Envía imagen + link
│  └─ Mensaje: "¡Mira mi trofeo!"
│
└─ [Email]
   └─ Envía a sí mismo o a alguien más
```

## 10.5 Historial de Trofeos en Perfil

```
MIS TROFEOS
────────────────
[Grid de trofeos ganados, ordenados por fecha]

🏆 🏆 🏆
Copa      Clásico de   Torneo de
Primavera Verano       Otoño
2025      2025         2024

Total: 3 trofeos en tu carrera
```

---

# SECCIÓN 11: PERFIL DEL JUGADOR — ESPECIFICACIÓN VISUAL Y FUNCIONAL

[Versión completa de la Sección 11 anterior...]

_(Aquí iría el contenido completo de Mi Perfil, Habilidades, Medallas, etc.)_

---

# SECCIÓN 12: PERFIL DEL COACH — FEATURES Y FLUJOS

[Versión completa de Coach features...]

---

# SECCIÓN 13: PANEL DEL ADMINISTRADOR — DASHBOARD Y GESTIÓN

[Versión completa de Admin panel...]

---

# SECCIÓN 14: WHITE-LABEL, PERSONALIZACIÓN Y MONETIZACIÓN

[Versión completa...]

---

# SECCIÓN 15: ESTRUCTURA DE BASE DE DATOS (Schema PostgreSQL)

## 15.1 Tablas Principales

### users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  age_group VARCHAR(20), -- 'junior', 'juvenil', 'adulto', 'senior'
  phone VARCHAR(20),
  photo_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

### clubs

```sql
CREATE TABLE clubs (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address VARCHAR(500),
  city VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  logo_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verification_method VARCHAR(50), -- 'google_places', 'manual'
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

### club_members

```sql
CREATE TABLE club_members (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  club_id UUID REFERENCES clubs(id),
  category VARCHAR(10), -- 'D', 'C', 'B', 'A', 'Pro'
  role VARCHAR(50), -- 'player', 'coach', 'admin'
  joined_at TIMESTAMP DEFAULT NOW(),
  LEFT_at TIMESTAMP,
  UNIQUE(user_id, club_id)
);
```

### xp_history

```sql
CREATE TABLE xp_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  source VARCHAR(100), -- 'training', 'match_win', 'match_loss', 'tournament', 'achievement'
  source_id UUID, -- FK a training_session, match, tournament, etc.
  club_id UUID REFERENCES clubs(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### matches

```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY,
  club_id UUID REFERENCES clubs(id),
  player1_id UUID REFERENCES users(id),
  player2_id UUID REFERENCES users(id),
  type VARCHAR(20), -- 'singles', 'doubles'
  partner1_id UUID REFERENCES users(id), -- si doubles
  partner2_id UUID REFERENCES users(id), -- si doubles
  court VARCHAR(255),
  match_date DATE,
  duration_minutes INTEGER,
  result_set1 VARCHAR(20), -- "6-4"
  result_set2 VARCHAR(20),
  result_set3 VARCHAR(20),
  status VARCHAR(50), -- 'pending', 'confirmed', 'disputed', 'rejected', 'expired'
  created_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMP,
  has_umpire BOOLEAN DEFAULT FALSE,
  umpire_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### match_stats

```sql
CREATE TABLE match_stats (
  id UUID PRIMARY KEY,
  match_id UUID REFERENCES matches(id),
  player_id UUID REFERENCES users(id),
  aces INTEGER DEFAULT 0,
  winners INTEGER DEFAULT 0,
  double_faults INTEGER DEFAULT 0,
  forced_errors INTEGER DEFAULT 0,
  unforced_errors INTEGER DEFAULT 0,
  points_for INTEGER DEFAULT 0,
  points_against INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### training_sessions

```sql
CREATE TABLE training_sessions (
  id UUID PRIMARY KEY,
  club_id UUID REFERENCES clubs(id),
  coach_id UUID REFERENCES users(id),
  title VARCHAR(255),
  session_date DATE,
  session_time TIME,
  court VARCHAR(255),
  categories VARCHAR(255), -- "B,C,D"
  notes TEXT,
  qr_code TEXT, -- si usa QR
  status VARCHAR(50), -- 'planned', 'in_progress', 'completed', 'cancelled'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### attendance

```sql
CREATE TABLE attendance (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES training_sessions(id),
  user_id UUID REFERENCES users(id),
  attended BOOLEAN DEFAULT FALSE,
  scanned_at TIMESTAMP, -- si usa QR
  marked_at TIMESTAMP, -- si es manual
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);
```

### tournaments

```sql
CREATE TABLE tournaments (
  id UUID PRIMARY KEY,
  club_id UUID REFERENCES clubs(id),
  created_by_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  season VARCHAR(50), -- 'spring', 'summer', 'autumn', 'winter'
  type VARCHAR(50), -- 'internal', 'open'
  start_date DATE,
  end_date DATE,
  categories VARCHAR(255), -- "B,C"
  format VARCHAR(50), -- 'elimination', 'round_robin', 'groups'
  max_players INTEGER,
  generates_ranking BOOLEAN DEFAULT TRUE,
  rank_multiplier DECIMAL(3, 1) DEFAULT 1.0, -- 1, 1.5, 2
  status VARCHAR(50), -- 'planning', 'open', 'in_progress', 'finished', 'archived'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### tournament_bracket

```sql
CREATE TABLE tournament_bracket (
  id UUID PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id),
  bracket_json JSONB, -- Estructura del bracket
  created_at TIMESTAMP DEFAULT NOW()
);
```

### achievements

```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  achievement_type VARCHAR(100), -- 'first_step', 'champion', etc.
  name VARCHAR(255),
  description TEXT,
  rarity VARCHAR(20), -- 'common', 'silver', 'gold'
  unlocked_at TIMESTAMP DEFAULT NOW(),
  shared_platforms VARCHAR(500), -- "instagram,twitter"
  created_at TIMESTAMP DEFAULT NOW()
);
```

### streaks

```sql
CREATE TABLE streaks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  streak_type VARCHAR(100), -- 'training', 'wins', 'losses', 'titles', 'matches'
  current_count INTEGER DEFAULT 0,
  max_record INTEGER DEFAULT 0,
  status VARCHAR(50), -- 'active', 'broken'
  last_activity_date DATE,
  reset_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, streak_type)
);
```

### evaluations

```sql
CREATE TABLE evaluations (
  id UUID PRIMARY KEY,
  coach_id UUID REFERENCES users(id),
  student_id UUID REFERENCES users(id),
  club_id UUID REFERENCES clubs(id),
  evaluation_type VARCHAR(50), -- 'monthly_checkin', 'quarterly'
  year INTEGER,
  quarter INTEGER, -- 1-4
  forehand INTEGER, -- 1-10
  backhand INTEGER,
  serve INTEGER,
  volley INTEGER,
  mobility INTEGER,
  slice INTEGER,
  notes TEXT,
  progression VARCHAR(50), -- 'improved', 'stable', 'regressed'
  category_before VARCHAR(10),
  category_after VARCHAR(10),
  promoted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### club_branding

```sql
CREATE TABLE club_branding (
  id UUID PRIMARY KEY,
  club_id UUID REFERENCES clubs(id) UNIQUE,
  primary_color VARCHAR(7), -- "#1a5e2a"
  secondary_color VARCHAR(7),
  logo_url TEXT,
  banner_url TEXT,
  font_family VARCHAR(100),
  custom_css TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### subscription_plans

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY,
  name VARCHAR(100), -- 'free', 'premium'
  description TEXT,
  price_monthly DECIMAL(10, 2),
  features JSONB, -- {tournament_limit: 5, coach_limit: 2, ...}
  created_at TIMESTAMP DEFAULT NOW()
);
```

### subscriptions

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  club_id UUID REFERENCES clubs(id),
  plan_id UUID REFERENCES subscription_plans(id),
  status VARCHAR(50), -- 'active', 'cancelled', 'expired'
  start_date DATE,
  end_date DATE,
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 15.2 Índices Recomendados

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_club_members_user_club ON club_members(user_id, club_id);
CREATE INDEX idx_club_members_club_category ON club_members(club_id, category);
CREATE INDEX idx_matches_club_date ON matches(club_id, match_date DESC);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_xp_history_user ON xp_history(user_id);
CREATE INDEX idx_xp_history_source ON xp_history(source);
CREATE INDEX idx_training_sessions_club ON training_sessions(club_id);
CREATE INDEX idx_tournaments_club ON tournaments(club_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_achievements_user ON achievements(user_id);
CREATE INDEX idx_streaks_user ON streaks(user_id);
CREATE INDEX idx_evaluations_student ON evaluations(student_id);
CREATE INDEX idx_evaluations_coach ON evaluations(coach_id);
CREATE INDEX idx_subscriptions_club ON subscriptions(club_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

---

# SECCIÓN 16: API ENDPOINTS Y CONTRATOS BACKEND

## 16.1 Auth Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token
POST   /api/auth/reset-password
GET    /api/auth/me (current user)
```

## 16.2 User Endpoints

```
GET    /api/users/:id
PUT    /api/users/:id
GET    /api/users/:id/profile (perfil completo)
GET    /api/users/:id/xp
GET    /api/users/:id/achievements
GET    /api/users/:id/streaks
GET    /api/users/:id/matches (historial)
GET    /api/users/:id/stats (estadísticas)
```

## 16.3 Club Endpoints

```
POST   /api/clubs
GET    /api/clubs/:id
PUT    /api/clubs/:id
GET    /api/clubs/:id/members
GET    /api/clubs/:id/rankings
GET    /api/clubs/:id/tournaments
POST   /api/clubs/:id/verify (verificar con Google Places)
POST   /api/clubs/:id/branding (white-label)
```

## 16.4 Match Endpoints

```
POST   /api/matches
GET    /api/matches/:id
PUT    /api/matches/:id
POST   /api/matches/:id/confirm
POST   /api/matches/:id/dispute
POST   /api/matches/:id/stats (registrar con juez)
GET    /api/matches (historial del usuario)
```

## 16.5 Training Endpoints

```
POST   /api/trainings
GET    /api/trainings/:id
PUT    /api/trainings/:id
POST   /api/trainings/:id/generate-qr
POST   /api/trainings/:id/close (generar XP)
GET    /api/trainings/:id/attendance
POST   /api/attendance/:session_id
```

## 16.6 Tournament Endpoints

```
POST   /api/tournaments
GET    /api/tournaments/:id
PUT    /api/tournaments/:id
POST   /api/tournaments/:id/generate-bracket
POST   /api/tournaments/:id/close-inscriptions
POST   /api/tournaments/:id/match/:match_id/result
GET    /api/tournaments/:id/bracket
GET    /api/tournaments/:id/rankings
```

## 16.7 Evaluation Endpoints

```
POST   /api/evaluations
GET    /api/evaluations/:id
PUT    /api/evaluations/:id
POST   /api/evaluations/:id/submit
GET    /api/evaluations/user/:user_id (historial)
POST   /api/evaluations/:id/promote (sugerir ascenso)
```

## 16.8 Achievement Endpoints

```
GET    /api/achievements/user/:user_id
POST   /api/achievements/check-unlock
GET    /api/achievements/:id/share (generar URL pública)
```

---

# SECCIÓN 17: MODELOS DE DATOS (TypeScript Interfaces)

## 17.1 User Model

```typescript
interface User {
  id: string;
  email: string;
  fullName: string;
  dateOfBirth: Date;
  ageGroup: 'junior' | 'juvenil' | 'adulto' | 'senior';
  phone?: string;
  photoUrl?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserProfile extends User {
  totalXP: number;
  clubs: Club[];
  achievements: Achievement[];
  streaks: Streak[];
  matchHistory: Match[];
  stats: UserStats;
}

interface UserStats {
  totalMatches: number;
  friendlyMatches: number;
  tournamentMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  totalAces: number;
  totalWinners: number;
  unforced​ErrorPercentage: number;
  currentStreak: number;
  maxStreak: number;
}
```

## 17.2 Club Model

```typescript
interface Club {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  logoUrl?: string;
  verified: boolean;
  verificationMethod?: 'google_places' | 'manual';
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ClubBranding {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  bannerUrl?: string;
  fontFamily?: string;
  customCSS?: string;
}
```

## 17.3 Match Model

```typescript
interface Match {
  id: string;
  clubId: string;
  type: 'singles' | 'doubles';
  players: {
    player1Id: string;
    player2Id: string;
    partner1Id?: string;
    partner2Id?: string;
  };
  court: string;
  matchDate: Date;
  durationMinutes: number;
  result: {
    set1: string; // "6-4"
    set2: string;
    set3?: string;
    winner: 'player1' | 'player2' | 'tied';
  };
  status: 'pending' | 'confirmed' | 'disputed' | 'rejected' | 'expired';
  hasUmpire: boolean;
  umpireId?: string;
  stats?: MatchStats;
  createdAt: Date;
  updatedAt: Date;
}

interface MatchStats {
  player1: {
    aces: number;
    winners: number;
    doubleFaults: number;
    forcedErrors: number;
    unforcedErrors: number;
    pointsFor: number;
    pointsAgainst: number;
  };
  player2: { /* same */ };
}
```

## 17.4 Achievement Model

```typescript
interface Achievement {
  id: string;
  userId: string;
  type: string; // 'first_step', 'champion', etc.
  name: string;
  description: string;
  rarity: 'common' | 'silver' | 'gold';
  iconUrl: string;
  condition: string; // descripción de cómo se desbloquea
  unlockedAt: Date;
  sharedOn?: Array<'instagram' | 'twitter' | 'whatsapp'>;
}
```

## 17.5 Streak Model

```typescript
interface Streak {
  id: string;
  userId: string;
  type: 'training' | 'wins' | 'losses' | 'titles' | 'matches';
  currentCount: number;
  maxRecord: number;
  status: 'active' | 'broken';
  lastActivityDate: Date;
  resetDate?: Date;
  updatedAt: Date;
}
```

## 17.6 Tournament Model

```typescript
interface Tournament {
  id: string;
  clubId: string;
  createdById: string;
  name: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  type: 'internal' | 'open';
  startDate: Date;
  endDate: Date;
  categories: string[]; // ['B', 'C']
  format: 'elimination' | 'round_robin' | 'groups';
  maxPlayers: number;
  generatesRanking: boolean;
  rankMultiplier: number; // 1, 1.5, 2
  status: 'planning' | 'open' | 'in_progress' | 'finished' | 'archived';
  bracket?: Bracket;
  trophy?: TrophyAsset;
  createdAt: Date;
  updatedAt: Date;
}

interface Bracket {
  // Estructura de árbol del torneo
  // Implementación depende del formato
  tournament_id: string;
  structure: any; // JSON complejo
}
```

## 17.7 Trophy Model

```typescript
interface TrophyAsset {
  id: string;
  tournamentId: string;
  winnerId: string;
  tournamentName: string;
  seasonTheme: 'spring' | 'summer' | 'autumn' | 'winter';
  winnerName: string;
  winnerCategory: string;
  winnerAgeGroup: string;
  winDate: Date;
  customMessage?: string; // max 50 chars
  backgroundColor?: string;
  includePhoto: boolean;
  photoUrl?: string;
  createdAt: Date;
  shareableUrl: string;
}
```

---

# SECCIÓN 18: SEGURIDAD, AUTENTICACIÓN Y RLS POLICIES

## 18.1 Autenticación (Supabase Auth)

```
Métodos soportados:
├─ Email + Password
├─ Google OAuth
└─ Apple OAuth

Session Management:
├─ JWT tokens (corta duración: 1 hora)
├─ Refresh tokens (larga duración: 7 días)
└─ Auto-refresh en el cliente
```

## 18.2 Row Level Security (RLS) — Políticas Críticas

### Tabla: users

```sql
-- Cada usuario puede ver su propio perfil
CREATE POLICY "Users can view own profile" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

-- Usuarios del mismo club pueden ver perfiles (excepto privados)
CREATE POLICY "Club members can view other members"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_members cm1
      JOIN club_members cm2 ON cm1.club_id = cm2.club_id
      WHERE cm1.user_id = auth.uid()
      AND cm2.user_id = users.id
    )
  );

-- Nadie puede editar otro usuario
CREATE POLICY "Users can only edit own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

### Tabla: matches

```sql
-- Solo jugadores del partido pueden verlo antes de confirmación
CREATE POLICY "Only involved players can see pending matches"
  ON matches FOR SELECT
  USING (
    CASE 
      WHEN status = 'pending' 
        THEN auth.uid() = player1_id 
          OR auth.uid() = player2_id
          OR auth.uid() = partner1_id
          OR auth.uid() = partner2_id
      ELSE TRUE  -- Confirmados son públicos
    END
  );

-- Solo creador puede editar si está pendiente
CREATE POLICY "Only creator can edit pending match"
  ON matches FOR UPDATE
  USING (status = 'pending' AND auth.uid() = created_by_id);
```

### Tabla: evaluations

```sql
-- Solo el coach puede ver/editar sus evaluaciones
CREATE POLICY "Coach can see own evaluations"
  ON evaluations FOR SELECT
  USING (auth.uid() = coach_id);

-- El alumno solo ve su propia evaluación
CREATE POLICY "Student can see own evaluation"
  ON evaluations FOR SELECT
  USING (auth.uid() = student_id);

-- Coach solo puede editar si es suya
CREATE POLICY "Coach can only edit own evaluations"
  ON evaluations FOR UPDATE
  USING (auth.uid() = coach_id);
```

### Tabla: xp_history

```sql
-- Cada usuario solo ve su propio historial
CREATE POLICY "Users can only see own XP history"
  ON xp_history FOR SELECT
  USING (auth.uid() = user_id);
```

---

# SECCIÓN 19: ESTADOS, TRANSICIONES Y STATE MACHINES

## 19.1 Estados de Match

```
┌──────────────────────────────────────┐
│      MÁQUINA DE ESTADOS — MATCH      │
└──────────────────────────────────────┘

[CREADO]
   │
   ├─ (Player A registra) ──→ [PENDIENTE_CONFIRMACION]
   │
   └─ (Timeout 48h) ──────→ [PENDIENTE_EXPIRADO] (sin XP)

[PENDIENTE_CONFIRMACION]
   │
   ├─ (Player B confirma) ─→ [CONFIRMADO] (XP acreditados)
   │
   ├─ (Player B disputa) ──→ [DISPUTADO] (negocia)
   │
   └─ (Player B rechaza) ──→ [RECHAZADO] (sin XP)

[DISPUTADO]
   │
   ├─ (Player A acepta corrección) ──→ [CONFIRMADO]
   │
   ├─ (Timeout 24h sin acuerdo) ────→ [RECHAZADO]
   │
   └─ (Uno insiste) ────────────────→ [RECHAZADO]

[CONFIRMADO] ← Estado final
   │
   └─ XP acreditados, estadísticas guardadas

[RECHAZADO] ← Estado final
   └─ Sin XP, sin estadísticas
```

## 19.2 Estados de Tournament

```
[PLANNING]
   │
   ├─ (Coach abre inscripciones) ──→ [OPEN]
   │
   └─ (Coach cancela) ──────────→ [CANCELLED]

[OPEN]
   │
   ├─ (Jugadores se inscriben)
   │
   ├─ (Coach cierra inscripciones) ──→ [IN_PROGRESS]
   │
   └─ (Timeout sin inscriptos) ────→ [CANCELLED]

[IN_PROGRESS]
   │
   ├─ (Se registran resultados partido a partido)
   │
   └─ (Último partido finalizado) ──→ [FINISHED]

[FINISHED]
   │
   ├─ (XP acreditados)
   │
   ├─ (Ranking points acreditados)
   │
   ├─ (Trophy generado)
   │
   └─ (Automáticamente) ──→ [ARCHIVED]

[ARCHIVED] ← Estado final
   └─ Visible pero no editable
```

## 19.3 Estados de Evaluation

```
[PENDIENTE]
   │
   ├─ (Coach inicia) ──→ [EN_PROCESO]
   │
   └─ (Timeout trimestral) ──→ [VENCIDA]

[EN_PROCESO]
   │
   ├─ (Coach completa y guarda) ──→ [COMPLETADA]
   │
   └─ (Coach descarta) ──→ [DESCARTADA]

[COMPLETADA]
   │
   ├─ (Rating actualizado)
   │
   ├─ (Si aplica, promoción sugerida)
   │
   └─ (Automáticamente) ──→ [ARCHIVADA]

[ARCHIVADA] ← Estado final
   └─ Visible pero no editable
```

---

# SECCIÓN 20: NOTIFICACIONES — MATRIZ COMPLETA

## 20.1 Matriz de Eventos → Notificaciones

|Evento|Push?|In-app?|A quién|Cuándo|Contenido|
|---|---|---|---|---|---|
|Rival crea reto|Sí|Sí|Rival|Inmediato|"Carlos registró un partido contigo"|
|Rival confirma reto|Sí|Sí|Creador|Inmediato|"Sofia confirmó tu partido"|
|Rival disputa reto|Sí|Sí|Creador|Inmediato|"Sofia cuestiona el resultado"|
|Rival rechaza reto|Sí|Sí|Creador|Inmediato|"Sofia rechazó tu partido"|
|XP acreditados|Sí|Sí|Jugador|Inmediato|"+50 XP por asistencia"|
|Medalla desbloqueada|Sí|Sí|Jugador|Inmediato|"🎖️ ¡Desbloqueaste Campeón!"|
|Evaluación completada|Sí|Sí|Alumno|Inmediato|"Tu coach completó tu evaluación"|
|Ascenso sugerido|Sí|Sí|Coach|Inmediato|"Carlos puede subir a Cat. A"|
|Sesión entrenamiento próxima|Sí|In-app|Convocados|24h antes|"Sesión mañana a las 18:00"|
|Sesión entrenamiento creada|In-app|Sí|Convocados|Inmediato|"Nueva sesión de entrenamiento"|
|Torneo inscripciones abiertas|In-app|Sí|Club|Inmediato|"Copa Primavera abierta a inscripción"|
|Torneo cerrado para inscripciones|In-app|In-app|Inscritos|Inmediato|"Las inscripciones cerraron"|
|Resultado de torneo registrado|Sí|Sí|Jugadores|Inmediato|"Resultado: Carlos ganó a Sofia"|
|Campeón coronado|Sí|Sí|Club|Inmediato|"🏆 Carlos es campeón de la Copa!"|
|Trophy generado|Sí|Sí|Ganador|Inmediato|"Tu trofeo digital está listo"|
|Racha se rompe|In-app|Sí|Jugador|Inmediato|"Rompiste tu racha de 7 victorias"|
|Evaluación próxima a vencer|Sí|In-app|Coach|7 días antes|"7 alumnos con evaluación próxima"|
|Boletín publicado|Sí|In-app|Club|Inmediato|"Nuevo boletín del club"|
|Reconocimiento publicado|In-app|Sí|Jugador|Inmediato|"¡Te han reconocido!"|
|Cumpleaños|In-app|Sí|Jugador|En la fecha|"¡Feliz cumpleaños!"|

## 20.2 Frecuencia Máxima de Notificaciones

```
A un usuario NO se le pueden enviar más de:
- 5 notificaciones push por día (excepto urgentes)
- Urgentes: Partido creado, resultado confirmado (sin límite)
- Agrupable: 1 notificación por hora de "XX alumnos requieren evaluación"

Horario de silencio (opcional):
- User puede definir "no molestar" entre 22:00 y 08:00
- Las notificaciones se encolan y se envían al abrir la app
```

---

# SECCIÓN 21: CASOS DE ERROR Y EDGE CASES

## 21.1 Casos de Error en Partidos

### Caso: Rival no responde en 48 horas

```
Acción esperada:
1. Sistema detecta que han pasado 48h sin respuesta
2. Partido cambia estado a PENDIENTE_EXPIRADO
3. Sin XP para nadie
4. Notificación a ambos: "El tiempo para confirmar expiró"
5. Ambos pueden ver el partido en historial con estado [EXPIRADO]

Implementación:
- Job cron que corre cada hora
- Busca todos los matches con status PENDING y created_at < now - 48h
- Actualiza status a PENDING_EXPIRADO
- Envía notificaciones
```

### Caso: Juez intenta registrar stats después de cerrar

```
Acción esperada:
1. Juez tappea [CERRAR PARTIDO]
2. Sistema calcula resumen final
3. UI muestra confirmación: "¿Cierras el partido?"
4. Juez confirma → estado pasa a CLOSED
5. Si juez intenta hacer clic en los botones de punto:
   → Error: "El partido está cerrado. No puedes registrar más puntos."
6. Estadísticas son INMUTABLES después de cerrar
```

### Caso: Dos jugadores crean el mismo partido casi simultáneamente

```
Acción esperada:
1. Jugador A crea: Carlos vs Sofia, 6-4, 7-5
2. Jugador B crea CASI AL MISMO TIEMPO: Carlos vs Sofia, 7-6, 6-3
3. Sistema detecta: dos matches de los mismos jugadores con 5 minutos diferencia
4. Muestra alerta a B: "Ya existe un partido similar en creación.
                       ¿Quieres editar el anterior o crear uno nuevo?"
5. B puede cancelar el suyo y confirmar el de A

Implementación:
- Validación en POST /api/matches
- Busca matches no confirmados: mismo players, mismo día, <5 min diferencia
- Si existe: devuelve error con opción de editar
```

---

## 21.2 Casos de Error en Evaluaciones

### Caso: Coach intenta promocionar a alumno sin cumplir umbral

```
Sistema valida ANTES:
1. Coach ajusta sliders de habilidades
2. Rating calculado en tiempo real: 68/100
3. Coach tappea [CONFIRMAR]
4. Sistema CALCULA automáticamente:
   - Actual rating: 68 (< 75 requerido para B→A)
   - Promoción NO SUGERIDA
5. Coach NO VE opción de promover
6. Si intenta manipular (editar URL, post request manual):
   - RLS policy RECHAZA la actualización
   - Error: "El alumno no cumple umbrales para promoción"
```

### Caso: Dos coaches evalúan al mismo alumno al mismo tiempo

```
Acción esperada:
1. Coach 1 abre evaluación de Sofia
2. Coach 2 abre evaluación de Sofia (MISMO ALUMNO)
3. Coach 1 completa y guarda primero
4. Coach 2 intenta guardar:
   → Error: "Esta evaluación fue actualizada. 
              Recarga para ver los cambios."
5. Coach 2 actualiza (refresh)
6. Coach 2 ve los cambios de Coach 1
7. Coach 2 puede optar por aplicar sus cambios encima (overwrite) o descartar

Implementación:
- Campo `updated_at` con timestamp
- Cliente valida: si evaluación.updated_at > last_loaded_at
- Si true: mostrar modal pidiendo refresh
```

---

## 21.3 Casos de Error en Torneos

### Caso: Club intenta crear torneo con 0 jugadores

```
Acción esperada:
1. Coach crea torneo sin inscritos
2. Coach tappea [CERRAR INSCRIPCIONES]
3. Sistema valida: max_players = 0
4. Error: "Necesitas al menos 1 jugador inscrito
            para generar bracket."
5. Torneo se mantiene en estado OPEN
6. Coach puede agregar jugadores o cancelar
```

### Caso: Jugador se inscribe en 2 torneos que se juegan simultáneamente

```
Acción esperada:
1. Torneo A: 25 Abr 18:00
2. Torneo B: 25 Abr 19:00
3. Jugador intenta inscribirse en ambos
4. Sistema PERMITE (no hay validación de conflicto horario)
5. Si ambos generan partidos a la misma hora:
   - Jugador DEBE HACER UNO SOLO
   - Coach puede elegir al remplazo automáticamente
   - Jugador puede solicitar cambio de hora al otro torneo

Decisión: NO bloqueamos inscripción. Sí bloqueamos si hay partido programado.
```

---

# SECCIÓN 22: CÁLCULOS, FÓRMULAS Y LÓGICA EXACTA

## 22.1 Cálculo de Rating

### Fórmula Base

```
Rating = (Derecha + Revés + Saque + Volea + Movilidad + Slice) / 6 × 10
```

### Redondeo

```
Usando: Math.round(resultado)

Ejemplo:
(7 + 5 + 7 + 4 + 7 + 6) / 6 × 10
= 36 / 6 × 10
= 6 × 10
= 60.0

Otro ejemplo con decimal:
(7 + 5 + 6 + 4 + 7 + 6) / 6 × 10
= 35 / 6 × 10
= 5.833... × 10
= 58.33...
= Math.round(58.33)
= 58
```

## 22.2 Cálculo de Racha

### Regla: se incrementa si la condición es TRUE el día

```
Pseudocódigo:

function updateStreak(userId, streakType) {
  let streak = getStreak(userId, streakType);
  let lastActivity = streak.lastActivityDate;
  let today = getToday();
  
  if (lastActivity == today) {
    // Ya se incrementó hoy, no hacer nada
    return;
  }
  
  if (lastActivity == yesterday(today)) {
    // Es el día siguiente, incrementar
    streak.currentCount += 1;
    streak.lastActivityDate = today;
    
    // Actualizar max_record si aplica
    if (streak.currentCount > streak.maxRecord) {
      streak.maxRecord = streak.currentCount;
    }
  } else {
    // Pasó más de 1 día, resetear
    streak.currentCount = 1;
    streak.lastActivityDate = today;
    streak.status = "broken";
    streak.resetDate = today;
  }
  
  updateDB(streak);
}
```

## 22.3 Cálculo de Puntos de Ranking con Multiplicador

### Fórmula

```
Puntos de Ranking Finales = Base Points × Tournament Multiplier

Ejemplo 1: Ganas torneo interno
Puntos base: 120
Multiplicador: ×1
= 120 × 1 = 120 puntos

Ejemplo 2: Ganas torneo abierto
Puntos base: 120
Multiplicador: ×1.5
= 120 × 1.5 = 180 puntos

Ejemplo 3: Ganas torneo especial
Puntos base: 120
Multiplicador: ×2
= 120 × 2 = 240 puntos
```

## 22.4 Cálculo de Porcentaje de Error No Forzado

### Fórmula

```
Unforced Error % = (Errores No Forzados / Puntos Totales Jugados) × 100

Puntos Totales Jugados = Pts a Favor + Pts en Contra

Ejemplo:
Aces: 2
Winners: 5
D. Falta: 0
Err. Forz.: 2
Err. NF: 4
Pts Favor: 68
Pts Contra: 54

Puntos Totales = 68 + 54 = 122
Err. NF % = (4 / 122) × 100 = 3.28%
```

---

# SECCIÓN 23: PERFORMANCE, ESCALABILIDAD E ÍNDICES

## 23.1 Índices de Base de Datos

```sql
-- Críticos (necesarios para performance básica)
CREATE INDEX idx_club_members_user_club ON club_members(user_id, club_id);
CREATE INDEX idx_matches_club_date ON matches(club_id, match_date DESC);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_xp_history_user ON xp_history(user_id);

-- Secundarios (para queries complejas)
CREATE INDEX idx_tournaments_club_status ON tournaments(club_id, status);
CREATE INDEX idx_evaluations_student_date ON evaluations(student_id, created_at DESC);
CREATE INDEX idx_training_sessions_coach ON training_sessions(coach_id, session_date DESC);

-- Geoespacial (si usa búsqueda de clubs cercanos)
CREATE INDEX idx_clubs_geo ON clubs USING GIST (ll_to_earth(latitude, longitude));
```

## 23.2 Queries que Requieren Paginación

```
GET /api/users/:id/matches
  → Historial de 100+ partidos
  → Paginar: 20 items por página
  → Parámetros: ?page=1&limit=20

GET /api/clubs/:id/rankings
  → Ranking de 50+ jugadores
  → Paginar: 30 items por página
  → Parámetros: ?category=B&page=1&limit=30

GET /api/users/:id/xp-history
  → Historial de 1000+ eventos XP
  → Paginar: 50 items por página
  → Parámetros: ?month=2025-04&page=1
```

## 23.3 Caching Strategy

```
Cache en cliente (localStorage):
- User profile (24h)
- Club data (12h)
- Rankings (1h) — actualizar frecuentemente
- Personal XP (15 min) — actualizar muy frecuentemente

Cache en servidor (Redis — si escalamos):
- Leaderboards (15 min)
- Tournament brackets (real-time con websockets)
- User permissions/roles (1h)
```

---

# SECCIÓN 24: USER FLOWS Y WIREFRAMES (Descripciones)

## 24.1 User Flow — Crear y Confirmar Partido

```
START: Jugador abre galería
  ↓
[Tap jugador rival]
  ↓
[Ver perfil de rival]
  ↓
[Tap "RETAR"]
  ↓
[Modal "Crear Partido"]
  ├─ Tipo: Singles/Dobles
  ├─ Fecha: date picker
  ├─ Cancha: texto libre
  ├─ Duración: texto libre
  └─ [CREAR]
  ↓
[Resumen del reto]
"Carlos retó a Sofia a un partido
25 Abr · Pista 2 · Singles"
  ↓
[ENVIAR RETO]
  ↓
Sistema envía PUSH a Sofia:
"Carlos registró un partido contigo."
  ↓
Sofia recibe push
  ↓
[Tap notificación]
  ↓
[Ver detalles del partido]
  ├─ Rival: Carlos
  ├─ Fecha: 25 Abr
  ├─ Cancha: Pista 2
  └─ [CONFIRMAR] [DISPUTAR] [RECHAZAR]
  ↓
Sofia tappea [CONFIRMAR]
  ↓
Partido pasa a CONFIRMADO
  ↓
Ambos ven en historial con status [✅ CONFIRMADO]
  ↓
XP acreditados inmediatamente
  ↓
Notificación a Carlos: "Sofia confirmó tu partido"
  ↓
END
```

## 24.2 Wireframe Description — Pantalla Mi Perfil

```
[Header]
├─ [Foto circular] Carlos Rodriguez
├─ Club Tenis Norte
├─ [Badge: Cat. B · Adulto]
└─ [Botón editar]

[Hero Card]
├─ [Izquierda] ⚡ XP EXPERIENCIA
│                1,240 puntos
│                (+50 vs ayer)
│
└─ [Derecha]  ★ RATING CAT. B
               72 / 100
               (↑3 vs trimestre anterior)

[4 Stats Cards]
├─ #7 Ranking
├─ 24 Partidos
├─ 15 Victorias
└─ 3🔥 Racha

[Radar de Habilidades]
(gráfico tipo araña con 6 puntos)

[6 Barras de Habilidades]
├─ Derecha: ████████░ 7/10
├─ Revés: █████░░░░ 5/10
├─ Saque: ████████░ 7/10
├─ Volea: ████░░░░░ 4/10
├─ Movilidad: ████████░ 7/10
└─ Slice: ██████░░░ 6/10

[Medallas Grid]
🎖️ 🎖️ 🎖️ 🎖️
Desbloqueadas (negras)

🔒 🔒 🔒 🔒
Bloqueadas (grises)

[Rachas Activas]
🔥 Entrenamientos: 5 días
🔥 Victorias: 3 seguidas
⚡ Partidos: 2 días

[Gear]
🎾 Wilson Pro Staff Ultra 100
👟 Nike Air Zoom Vapor
🧵 Wilson Natural Gut 16

[Historial de Partidos]
Tabs: Amistosos | Torneos
[Lista de partidos confirmados]

[Trofeos]
🏆 🏆 🏆
Copa Primavera
```