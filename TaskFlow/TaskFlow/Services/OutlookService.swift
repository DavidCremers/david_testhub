import Foundation

/// Outlook/Microsoft 365 Integration Service
/// Uses Microsoft Graph API for calendar and email access
///
/// Setup Requirements:
/// 1. Register app in Azure Portal (Azure Active Directory)
/// 2. Add Microsoft Identity (MSAL) SDK via Swift Package Manager
/// 3. Configure URL schemes for auth callback
/// 4. Add required API permissions: Calendars.Read, Mail.Read
///
/// For production, add this package:
/// - MSAL: https://github.com/AzureAD/microsoft-authentication-library-for-objc

class OutlookService: ObservableObject {
    static let shared = OutlookService()

    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var userEmail: String?
    @Published var lastSyncDate: Date?
    @Published var error: OutlookError?

    // Azure AD configuration - replace with your credentials
    private let clientID = "YOUR_AZURE_CLIENT_ID"
    private let authority = "https://login.microsoftonline.com/common"
    private let redirectURI = "msauth.com.taskflow.app://auth"
    private let scopes = [
        "User.Read",
        "Calendars.Read",
        "Calendars.ReadWrite",
        "Mail.Read"
    ]

    private let graphEndpoint = "https://graph.microsoft.com/v1.0"

    enum OutlookError: LocalizedError {
        case notAuthenticated
        case networkError(String)
        case parseError
        case permissionDenied

        var errorDescription: String? {
            switch self {
            case .notAuthenticated:
                return "Je bent niet ingelogd bij Microsoft"
            case .networkError(let message):
                return "Netwerkfout: \(message)"
            case .parseError:
                return "Kon gegevens niet verwerken"
            case .permissionDenied:
                return "Geen toegang tot agenda"
            }
        }
    }

    /// Sign in with Microsoft account
    func signIn() async throws {
        isLoading = true
        defer { isLoading = false }

        // In production:
        // let application = try MSALPublicClientApplication(configuration: config)
        // let result = try await application.acquireToken(with: parameters)
        // accessToken = result.accessToken

        // Demo mode
        try await Task.sleep(nanoseconds: 1_000_000_000)
        isAuthenticated = true
        userEmail = "demo@outlook.com"
    }

    /// Sign out from Microsoft
    func signOut() {
        // In production: clear MSAL account cache
        isAuthenticated = false
        userEmail = nil
    }

    /// Fetch calendar events from Outlook
    func fetchCalendarEvents(from: Date, to: Date) async throws -> [OutlookCalendarEvent] {
        guard isAuthenticated else {
            throw OutlookError.notAuthenticated
        }

        isLoading = true
        defer { isLoading = false }

        // In production, this would call Microsoft Graph API:
        // GET /me/calendarview?startDateTime=...&endDateTime=...

        // Demo data
        let calendar = Calendar.current
        return [
            OutlookCalendarEvent(
                id: "outlook-1",
                subject: "Kwartaal Review Meeting",
                startDate: calendar.date(byAdding: .day, value: 2, to: Date())!,
                endDate: calendar.date(byAdding: .hour, value: 2, to: calendar.date(byAdding: .day, value: 2, to: Date())!)!,
                location: "Teams Meeting",
                isOnlineMeeting: true,
                onlineMeetingUrl: "https://teams.microsoft.com/meet/123",
                organizer: "manager@bedrijf.nl",
                attendees: ["jij@bedrijf.nl", "collega@bedrijf.nl"]
            ),
            OutlookCalendarEvent(
                id: "outlook-2",
                subject: "1-on-1 met Team Lead",
                startDate: calendar.date(byAdding: .day, value: 4, to: Date())!,
                endDate: calendar.date(byAdding: .minute, value: 30, to: calendar.date(byAdding: .day, value: 4, to: Date())!)!,
                location: nil,
                isOnlineMeeting: true,
                onlineMeetingUrl: "https://teams.microsoft.com/meet/456",
                organizer: "teamlead@bedrijf.nl",
                attendees: ["jij@bedrijf.nl"]
            ),
            OutlookCalendarEvent(
                id: "outlook-3",
                subject: "Sprint Planning",
                startDate: calendar.date(byAdding: .day, value: 5, to: Date())!,
                endDate: calendar.date(byAdding: .hour, value: 1, to: calendar.date(byAdding: .day, value: 5, to: Date())!)!,
                location: "Vergaderzaal A",
                isOnlineMeeting: false,
                onlineMeetingUrl: nil,
                organizer: "scrum@bedrijf.nl",
                attendees: ["team@bedrijf.nl"]
            )
        ]
    }

    /// Fetch tasks from Microsoft To Do
    func fetchTodoTasks() async throws -> [OutlookTodoTask] {
        guard isAuthenticated else {
            throw OutlookError.notAuthenticated
        }

        // In production: GET /me/todo/lists/{listId}/tasks

        return [
            OutlookTodoTask(
                id: "todo-1",
                title: "Rapport afronden",
                dueDate: Calendar.current.date(byAdding: .day, value: 1, to: Date()),
                importance: "high",
                isCompleted: false
            ),
            OutlookTodoTask(
                id: "todo-2",
                title: "Code review PR #567",
                dueDate: Date(),
                importance: "normal",
                isCompleted: false
            )
        ]
    }

    /// Sync Outlook calendar to app
    func syncCalendar(with dataController: DataController) async throws -> SyncResult {
        let startDate = Date()
        let endDate = Calendar.current.date(byAdding: .month, value: 1, to: startDate)!

        let outlookEvents = try await fetchCalendarEvents(from: startDate, to: endDate)

        var imported = 0
        var skipped = 0

        for outlookEvent in outlookEvents {
            // Check if event already exists
            let exists = dataController.events.contains { existing in
                existing.sourceReference == outlookEvent.id
            }

            if exists {
                skipped += 1
                continue
            }

            let event = CalendarEvent(
                title: outlookEvent.subject,
                category: .work,
                startDate: outlookEvent.startDate,
                endDate: outlookEvent.endDate,
                location: outlookEvent.location ?? outlookEvent.onlineMeetingUrl,
                importSource: .outlook,
                sourceReference: outlookEvent.id,
                attendees: outlookEvent.attendees
            )

            dataController.addEvent(event)
            imported += 1
        }

        lastSyncDate = Date()
        return SyncResult(imported: imported, skipped: skipped, errors: 0)
    }

    /// Sync Microsoft To Do tasks to app
    func syncTasks(with dataController: DataController) async throws -> SyncResult {
        let todoTasks = try await fetchTodoTasks()

        var imported = 0
        var skipped = 0

        for todoTask in todoTasks {
            let exists = dataController.tasks.contains { existing in
                existing.sourceReference == todoTask.id
            }

            if exists {
                skipped += 1
                continue
            }

            let priority: TaskPriority
            switch todoTask.importance {
            case "high": priority = .high
            case "low": priority = .low
            default: priority = .medium
            }

            let task = TaskItem(
                title: todoTask.title,
                category: .work,
                priority: priority,
                dueDate: todoTask.dueDate,
                isCompleted: todoTask.isCompleted,
                importSource: .outlook,
                sourceReference: todoTask.id
            )

            dataController.addTask(task)
            imported += 1
        }

        lastSyncDate = Date()
        return SyncResult(imported: imported, skipped: skipped, errors: 0)
    }
}

// MARK: - Data Models

struct OutlookCalendarEvent: Identifiable {
    let id: String
    let subject: String
    let startDate: Date
    let endDate: Date
    let location: String?
    let isOnlineMeeting: Bool
    let onlineMeetingUrl: String?
    let organizer: String
    let attendees: [String]
}

struct OutlookTodoTask: Identifiable {
    let id: String
    let title: String
    let dueDate: Date?
    let importance: String
    let isCompleted: Bool
}

struct SyncResult {
    let imported: Int
    let skipped: Int
    let errors: Int

    var message: String {
        var parts: [String] = []
        if imported > 0 { parts.append("\(imported) geïmporteerd") }
        if skipped > 0 { parts.append("\(skipped) overgeslagen") }
        if errors > 0 { parts.append("\(errors) fouten") }
        return parts.joined(separator: ", ")
    }
}
