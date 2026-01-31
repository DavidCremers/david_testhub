# TaskFlow - iOS Taak & Agenda App

Een complete iOS-app voor het beheren van taken en agenda, met onderscheid tussen werk en privé en slimme integraties met externe services.

## Functies

### Kernelementen
- **Twee secties**: Werk en Privé met eigen kleuren en filters
- **Taken beheer**: Volledige CRUD met prioriteiten, deadlines en tags
- **Agenda**: Dag-, week- en maandweergave met events
- **Snelle invoer**: Makkelijk taken en afspraken toevoegen

### Integraties
- **Gmail**: Detecteert actiepunten en vergaderverzoeken uit e-mails
- **Outlook/Microsoft 365**: Synchroniseert agenda en Microsoft To Do
- **WhatsApp**: Deel berichten naar TaskFlow via iOS Share Extension

## Project Structuur

```
TaskFlow/
├── TaskFlowApp.swift          # App entry point
├── ContentView.swift          # Main tab navigation
├── Models/
│   ├── CategoryModel.swift    # TaskCategory, Priority, ImportSource
│   ├── TaskModel.swift        # TaskItem model
│   └── EventModel.swift       # CalendarEvent model
├── Views/
│   ├── HomeView.swift         # Dashboard met overzicht
│   ├── TaskListView.swift     # Taken lijst met filters
│   ├── CalendarView.swift     # Agenda met 3 weergaves
│   ├── AddTaskView.swift      # Nieuwe taak formulier
│   └── AddEventView.swift     # Nieuwe afspraak formulier
├── ViewModels/
│   ├── DataController.swift   # Data persistentie & state
│   ├── TaskViewModel.swift    # Task filtering & sorting
│   └── EventViewModel.swift   # Calendar navigation
└── Services/
    ├── GmailService.swift     # Gmail API integratie
    ├── OutlookService.swift   # Microsoft Graph API
    └── IntegrationManager.swift # Central integration hub
```

## Installatie & Setup

### Vereisten
- Xcode 15.0+
- iOS 17.0+
- Swift 5.9+

### Stappen
1. Open `TaskFlow.xcodeproj` in Xcode
2. Selecteer je development team in Signing & Capabilities
3. Build en run op simulator of device

### Integraties Configureren

#### Gmail
1. Maak project aan in [Google Cloud Console](https://console.cloud.google.com)
2. Activeer Gmail API
3. Maak OAuth 2.0 credentials (iOS app type)
4. Voeg `GoogleService-Info.plist` toe aan project
5. Installeer GoogleSignIn SDK via Swift Package Manager

#### Outlook/Microsoft 365
1. Registreer app in [Azure Portal](https://portal.azure.com)
2. Configureer redirect URI
3. Voeg API permissions toe: `Calendars.Read`, `Mail.Read`
4. Installeer MSAL SDK via Swift Package Manager

#### WhatsApp
WhatsApp integratie werkt via iOS Share Extension:
1. Voeg Share Extension target toe aan project
2. Configureer App Groups voor data sharing
3. Implementeer `ShareViewController` voor parsing

## Architectuur

De app volgt het MVVM (Model-View-ViewModel) patroon:

- **Models**: Pure data structuren (TaskItem, CalendarEvent)
- **Views**: SwiftUI views voor UI
- **ViewModels**: Business logic en state management
- **Services**: Externe API communicatie

### Data Persistentie
- Taken en events worden opgeslagen via UserDefaults (JSON encoded)
- Core Data setup is voorbereid voor toekomstige uitbreiding

## Toekomstige Uitbreidingen

- [ ] Apple Calendar integratie via EventKit
- [ ] Siri Shortcuts ondersteuning
- [ ] Widget voor homescreen
- [ ] iCloud sync
- [ ] Notificaties en herinneringen
- [ ] Recurring tasks
- [ ] Subtaken en checklists

## Licentie

MIT License - Vrij te gebruiken en aan te passen.
