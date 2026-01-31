import Foundation

/// Gmail Integration Service
/// Uses Google API for email access and task extraction
///
/// Setup Requirements:
/// 1. Create project in Google Cloud Console
/// 2. Enable Gmail API
/// 3. Create OAuth 2.0 credentials (iOS app type)
/// 4. Add GoogleService-Info.plist to project
/// 5. Add Google Sign-In SDK via Swift Package Manager
///
/// For production, add these packages:
/// - GoogleSignIn: https://github.com/google/GoogleSignIn-iOS
/// - GoogleAPIClientForREST/Gmail: https://github.com/google/google-api-objectivec-client-for-rest

class GmailService: ObservableObject {
    static let shared = GmailService()

    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var userEmail: String?
    @Published var lastSyncDate: Date?
    @Published var error: GmailError?

    // OAuth configuration - replace with your credentials
    private let clientID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
    private let scopes = [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.labels"
    ]

    enum GmailError: LocalizedError {
        case notAuthenticated
        case networkError(String)
        case parseError
        case quotaExceeded

        var errorDescription: String? {
            switch self {
            case .notAuthenticated:
                return "Je bent niet ingelogd bij Gmail"
            case .networkError(let message):
                return "Netwerkfout: \(message)"
            case .parseError:
                return "Kon e-mail niet verwerken"
            case .quotaExceeded:
                return "API-limiet bereikt. Probeer later opnieuw"
            }
        }
    }

    /// Sign in with Google
    /// In production, this would use GoogleSignIn SDK
    func signIn() async throws {
        isLoading = true
        defer { isLoading = false }

        // Simulated authentication flow
        // In production:
        // let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: rootViewController)
        // userEmail = result.user.profile?.email
        // isAuthenticated = true

        // Demo mode
        try await Task.sleep(nanoseconds: 1_000_000_000)
        isAuthenticated = true
        userEmail = "demo@gmail.com"
    }

    /// Sign out from Google
    func signOut() {
        // GIDSignIn.sharedInstance.signOut()
        isAuthenticated = false
        userEmail = nil
    }

    /// Fetch emails that might contain tasks
    /// Looks for action items, deadlines, and meeting invites
    func fetchPotentialTasks(since: Date? = nil) async throws -> [EmailTaskCandidate] {
        guard isAuthenticated else {
            throw GmailError.notAuthenticated
        }

        isLoading = true
        defer { isLoading = false }

        // In production, this would call Gmail API:
        // let query = "is:unread after:\(dateString) (subject:action OR subject:deadline OR subject:todo)"
        // let messages = try await gmailAPI.users.messages.list(userId: "me", q: query)

        // Demo data
        return [
            EmailTaskCandidate(
                id: "email-1",
                subject: "Actie vereist: Contract review",
                sender: "manager@bedrijf.nl",
                receivedDate: Date(),
                snippet: "Graag het bijgevoegde contract reviewen voor vrijdag...",
                suggestedTask: SuggestedTask(
                    title: "Contract reviewen",
                    dueDate: Calendar.current.date(byAdding: .day, value: 3, to: Date()),
                    priority: .high,
                    category: .work
                )
            ),
            EmailTaskCandidate(
                id: "email-2",
                subject: "Herinnering: Tandarts afspraak",
                sender: "noreply@tandarts.nl",
                receivedDate: Date(),
                snippet: "Uw afspraak is gepland voor volgende week dinsdag om 10:00...",
                suggestedTask: SuggestedTask(
                    title: "Tandarts afspraak",
                    dueDate: Calendar.current.date(byAdding: .day, value: 7, to: Date()),
                    priority: .medium,
                    category: .personal
                )
            )
        ]
    }

    /// Extract potential events from emails (meeting invites)
    func fetchMeetingInvites() async throws -> [EmailEventCandidate] {
        guard isAuthenticated else {
            throw GmailError.notAuthenticated
        }

        // In production: search for calendar invites in email
        // query: "has:attachment filename:ics OR from:calendar-notification"

        return [
            EmailEventCandidate(
                id: "event-1",
                subject: "Uitnodiging: Team standup",
                sender: "calendar@bedrijf.nl",
                suggestedEvent: SuggestedEvent(
                    title: "Team standup",
                    startDate: Calendar.current.date(byAdding: .day, value: 1, to: Date())!,
                    endDate: Calendar.current.date(byAdding: .hour, value: 1, to: Calendar.current.date(byAdding: .day, value: 1, to: Date())!)!,
                    location: "Vergaderzaal B",
                    category: .work
                )
            )
        ]
    }

    /// Smart parsing of email content to extract action items
    func parseEmailForActions(content: String) -> [String] {
        // Keywords that indicate action items
        let actionKeywords = [
            "graag", "actie", "deadline", "voor", "uiterlijk",
            "vergeet niet", "herinnering", "to do", "action required",
            "please", "could you", "kun je", "zou je"
        ]

        var actions: [String] = []
        let sentences = content.components(separatedBy: CharacterSet(charactersIn: ".!?\n"))

        for sentence in sentences {
            let lowercased = sentence.lowercased()
            if actionKeywords.contains(where: { lowercased.contains($0) }) {
                let cleaned = sentence.trimmingCharacters(in: .whitespacesAndNewlines)
                if !cleaned.isEmpty {
                    actions.append(cleaned)
                }
            }
        }

        return actions
    }
}

// MARK: - Data Models

struct EmailTaskCandidate: Identifiable {
    let id: String
    let subject: String
    let sender: String
    let receivedDate: Date
    let snippet: String
    let suggestedTask: SuggestedTask
}

struct SuggestedTask {
    var title: String
    var dueDate: Date?
    var priority: TaskPriority
    var category: TaskCategory
}

struct EmailEventCandidate: Identifiable {
    let id: String
    let subject: String
    let sender: String
    let suggestedEvent: SuggestedEvent
}

struct SuggestedEvent {
    var title: String
    var startDate: Date
    var endDate: Date
    var location: String?
    var category: TaskCategory
}
