# Flowday

Een persoonlijke taak- en agenda-applicatie met natuurlijke taal-input en spraakherkenning.

## Features

- **Twee Werkruimtes**: Gescheiden omgevingen voor Privé en Werk
- **Natuurlijke Taal Input**: Typ of spreek je taken en afspraken in natuurlijke taal
- **iOS Native Look & Feel**: Ontworpen volgens Apple's Human Interface Guidelines
- **Cross-Platform**: Native iOS app + Web app vanuit dezelfde codebase
- **Slimme Parsing**: Automatische herkenning van deadlines, prioriteiten en labels

## Tech Stack

- **Frontend**: React Native met Expo
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **State Management**: Zustand
- **Styling**: Native React Native StyleSheet
- **AI Parsing**: Anthropic Claude API (gepland)

## Project Structuur

```
flowday/
├── apps/
│   └── mobile/          # Expo React Native app (iOS, Android, Web)
├── packages/
│   ├── shared/          # Gedeelde types, utils, API calls
│   └── ui/              # Gedeelde UI componenten (toekomstig)
└── supabase/
    └── migrations/      # Database schema migraties
```

## Aan de slag

### Vereisten

- Node.js 18+
- pnpm 8+
- Expo CLI
- iOS Simulator (voor iOS development)
- Supabase account

### Installatie

1. **Clone en installeer dependencies**:
   ```bash
   cd flowday
   pnpm install
   ```

2. **Configureer omgevingsvariabelen**:
   ```bash
   cp apps/mobile/.env.example apps/mobile/.env
   ```

   Vul je Supabase credentials in:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Setup Supabase database**:
   - Maak een nieuw Supabase project aan
   - Voer de migratie uit in `supabase/migrations/001_initial_schema.sql`

4. **Start de development server**:
   ```bash
   pnpm dev:mobile
   ```

5. **Open de app**:
   - iOS Simulator: Druk op `i`
   - Web browser: Druk op `w`

## Scripts

```bash
# Start Expo development server
pnpm dev:mobile

# Start voor web
pnpm dev:web

# Build voor web
pnpm build:web

# Typecheck alle packages
pnpm typecheck
```

## Natuurlijke Taal Conventies

De app herkent de volgende patronen:

| Input | Resultaat |
|-------|-----------|
| `@werk` of `@privé` | Werkruimte toewijzen |
| `#label` | Label toewijzen |
| `!hoog` `!normaal` `!laag` | Prioriteit instellen |
| `project:naam` | Project toewijzen |
| `morgen`, `volgende week`, `vrijdag` | Deadline/datum |
| `14:00`, `2 uur` | Tijdstip |
| `elke dag`, `wekelijks` | Herhaling |

### Voorbeelden

```
"Bel tandarts morgen 14:00"
→ Agenda-item: "Bel tandarts", morgen 14:00-14:30

"Rapport afmaken voor vrijdag #werk !hoog"
→ Taak: "Rapport afmaken", deadline vrijdag, workspace Werk, prioriteit Hoog

"Elke maandag weekstart meeting 9:00 @werk"
→ Terugkerend agenda-item: maandag 9:00, Werk workspace
```

## Roadmap

### Fase 1: Fundament ✅
- [x] Expo project setup
- [x] Supabase integratie
- [x] Basis datamodel en CRUD
- [x] Workspace switching
- [x] Takenlijst UI

### Fase 2: Agenda & Terugkerende Items
- [ ] Agenda views (dag/week/maand)
- [ ] Event CRUD
- [ ] Recurrence logic
- [ ] Taken in agenda weergeven

### Fase 3: Intelligente Input
- [ ] Natural language parser (Claude API)
- [ ] Preview van parsed resultaat
- [ ] Spraakherkenning integratie

### Fase 4: Google Calendar Sync
- [ ] Google OAuth2 implementatie
- [ ] Calendar sync service
- [ ] Conflict resolution

### Fase 5: Polish & Deployment
- [ ] UI refinement en animaties
- [ ] Push notifications
- [ ] iOS TestFlight
- [ ] Web deployment

## Licentie

Privé project - Alle rechten voorbehouden.
