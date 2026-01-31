# TaskFlow Web

Een veilige, moderne web-app voor taak- en agendabeheer met spraakherkenning.
Gebouwd met Next.js, Supabase en Tailwind CSS.

## Features

- **Werk/Privé secties** - Gescheiden weergaves voor werk en persoonlijke items
- **Spraak invoer** - Spreek taken in met natuurlijke taal
- **Slimme parsing** - Herkent automatisch datums, tijden en prioriteiten
- **Real-time sync** - Wijzigingen verschijnen direct op alle devices
- **iOS PWA** - Installeer als "echte" app op je iPhone
- **Veilig** - Row Level Security, jouw data is alleen van jou

## Snel starten

### 1. Codespace openen

Klik op "Code" → "Codespaces" → "Create codespace on main"

De devcontainer installeert automatisch alle dependencies.

### 2. Supabase project aanmaken

1. Ga naar [supabase.com](https://supabase.com) en maak een gratis account
2. Maak een nieuw project
3. Kopieer de project URL en anon key

### 3. Environment variables instellen

Maak `.env.local` aan:

```bash
cp .env.example .env.local
```

Vul in:
```env
NEXT_PUBLIC_SUPABASE_URL=https://jouw-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=jouw-anon-key
```

### 4. Database migratie uitvoeren

Ga naar Supabase Dashboard → SQL Editor en voer uit:
```
supabase/migrations/20240131000000_initial_schema.sql
```

Of via CLI:
```bash
npx supabase db push
```

### 5. App starten

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Installeren op iPhone

1. Open de app in Safari op je iPhone
2. Tik op het "Deel" icoon (vierkant met pijl)
3. Scroll naar beneden en tik op "Zet op beginscherm"
4. Geef de app een naam en tik op "Voeg toe"

## Spraak invoer gebruiken

De app ondersteunt Nederlandse spraakherkenning. Voorbeelden:

| Wat je zegt | Wat de app maakt |
|-------------|------------------|
| "Boodschappen doen morgen" | Taak met deadline morgen |
| "Meeting met Jan dinsdag om 14:00" | Afspraak op dinsdag 14:00 |
| "Urgent rapport afmaken" | Taak met hoge prioriteit |
| "Tandarts vrijdag 10:30 in centrum" | Afspraak met locatie |

## Beveiliging

### Row Level Security (RLS)

Alle database tabellen zijn beveiligd met RLS policies:
- Gebruikers kunnen **alleen hun eigen data** zien
- Geen admin backdoors of service-level toegang
- Alle queries worden automatisch gefilterd op user_id

### Security Headers

De app gebruikt strikte security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- Content Security Policy

### Data privacy

- Alle data wordt versleuteld opgeslagen
- Geen tracking of analytics
- Geen data delen met derden
- GDPR-compliant (EU hosting beschikbaar)

## Project structuur

```
taskflow-web/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx         # Hoofdpagina
│   │   ├── layout.tsx       # Root layout
│   │   └── auth/callback/   # OAuth callback
│   ├── components/          # React componenten
│   │   ├── VoiceInput.tsx   # Spraak invoer
│   │   ├── Dashboard.tsx    # Home dashboard
│   │   ├── TaskList.tsx     # Taken overzicht
│   │   ├── Calendar.tsx     # Agenda
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   │   ├── useTasks.ts      # Tasks CRUD + realtime
│   │   └── useEvents.ts     # Events CRUD + realtime
│   ├── lib/                 # Utilities
│   │   ├── supabase.ts      # Supabase client
│   │   ├── voice-parser.ts  # Spraak naar data
│   │   └── utils.ts         # Helpers
│   └── types/               # TypeScript types
│       └── database.ts
├── supabase/
│   ├── config.toml          # Supabase config
│   └── migrations/          # Database schema
├── public/
│   └── manifest.json        # PWA manifest
└── .devcontainer/           # Codespaces config
```

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production
npm run lint         # ESLint check
npm run db:push      # Push migrations to Supabase
```

## Gmail integratie (optioneel)

Om Gmail integratie te activeren:

1. Maak een project in [Google Cloud Console](https://console.cloud.google.com)
2. Activeer Gmail API
3. Maak OAuth 2.0 credentials
4. Voeg toe aan Supabase: Authentication → Providers → Google
5. Voeg environment variables toe:
   ```env
   GOOGLE_CLIENT_ID=xxx
   GOOGLE_CLIENT_SECRET=xxx
   ```

## Support

Bij problemen, maak een issue aan of bekijk de [Supabase docs](https://supabase.com/docs).
