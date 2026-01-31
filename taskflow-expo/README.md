# TaskFlow - Expo React Native App

Een complete taak- en agenda-app met Werk/Privé secties, spraakherkenning, en Supabase backend.

## Functies

- **Taken beheren**: Aanmaken, voltooien, verwijderen van taken
- **Agenda**: Kalenderweergave met events
- **Werk/Privé secties**: Filter tussen werk en privé items
- **Spraakherkenning**: Spreek taken en events in (Nederlands)
- **Veilig**: Row Level Security - alleen jouw data is zichtbaar
- **iOS & Android**: Werkt op beide platformen via Expo Go

## Setup Instructies

### Stap 1: Installeer Dependencies

```bash
cd taskflow-expo
npm install
```

### Stap 2: Configureer Supabase

1. Ga naar [Supabase](https://supabase.com) en maak een project aan (of gebruik je bestaande project)

2. Kopieer je credentials:
   - Project URL: `https://xxx.supabase.co`
   - Anon Key: `eyJ...` (te vinden in Settings > API)

3. Maak een `.env` bestand:
```bash
cp .env.example .env
```

4. Vul je credentials in:
```
EXPO_PUBLIC_SUPABASE_URL=https://jouw-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=jouw-anon-key
```

### Stap 3: Database Setup

Voer de SQL migration uit in Supabase SQL Editor:
- Open het bestand: `../taskflow-web/supabase/migrations/20240131000000_initial_schema.sql`
- Kopieer de inhoud en plak in Supabase SQL Editor
- Klik op "Run"

### Stap 4: Start de App

```bash
npx expo start
```

### Stap 5: Open in Expo Go

1. Download de **Expo Go** app:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scan de QR code die in de terminal verschijnt

3. De app opent in Expo Go!

## Bestanden Structuur

```
taskflow-expo/
├── App.tsx                 # App entry point
├── src/
│   ├── components/
│   │   ├── CategoryFilter.tsx
│   │   └── VoiceInput.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   ├── lib/
│   │   ├── supabase.ts     # Supabase client
│   │   └── voiceParser.ts  # NLP voor Nederlandse spraak
│   ├── screens/
│   │   ├── AddItemScreen.tsx
│   │   ├── CalendarScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── TasksScreen.tsx
│   └── types/
│       └── database.ts
├── app.json               # Expo config
├── package.json
└── tsconfig.json
```

## Spraakherkenning

De app herkent Nederlandse zinnen zoals:

- "Vergadering met team morgen om 10 uur werk"
- "Boodschappen doen dit weekend"
- "Rapport afmaken vrijdag urgent"
- "Tandarts afspraak volgende week dinsdag"

**Ondersteunde keywords:**
- Datums: vandaag, morgen, overmorgen, volgende week, maandag-zondag
- Tijden: om 10 uur, om 14:30
- Categorieën: werk, privé, kantoor, thuis
- Prioriteiten: urgent, belangrijk, spoed

## Beveiliging

- Alle data is beveiligd met Row Level Security (RLS)
- Gebruikers kunnen alleen hun eigen taken en events zien
- Authenticatie via Supabase Auth
- Geen directe database toegang mogelijk

## Troubleshooting

### "Cannot find module" errors
```bash
rm -rf node_modules
npm install
```

### Supabase connectie faalt
- Controleer of `.env` correct is geconfigureerd
- Zorg dat Supabase URL begint met `https://`
- Check of de anon key correct is gekopieerd

### Expo Go crash
- Zorg dat je de laatste versie van Expo Go hebt
- Probeer `npx expo start --clear` om cache te legen

## Assets

Voeg je eigen app icons toe in de `assets/` folder:
- `icon.png` - 1024x1024px (app icon)
- `splash.png` - 1284x2778px (splash screen)
- `adaptive-icon.png` - 1024x1024px (Android adaptive icon)
- `favicon.png` - 48x48px (web favicon)

Je kunt gratis icons genereren op: https://www.appicon.co/
