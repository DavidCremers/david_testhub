import Foundation
import SwiftUI

/// Central manager for all external integrations
/// Handles Gmail, Outlook, and WhatsApp connections
class IntegrationManager: ObservableObject {
    static let shared = IntegrationManager()

    @Published var gmailService = GmailService.shared
    @Published var outlookService = OutlookService.shared

    @Published var isSyncing = false
    @Published var lastFullSync: Date?
    @Published var syncError: String?

    /// Perform full sync of all connected services
    func syncAll(with dataController: DataController) async {
        await MainActor.run { isSyncing = true }
        defer {
            Task { @MainActor in
                isSyncing = false
                lastFullSync = Date()
            }
        }

        var errors: [String] = []

        // Sync Outlook if connected
        if outlookService.isAuthenticated {
            do {
                _ = try await outlookService.syncCalendar(with: dataController)
                _ = try await outlookService.syncTasks(with: dataController)
            } catch {
                errors.append("Outlook: \(error.localizedDescription)")
            }
        }

        // Process Gmail tasks if connected
        if gmailService.isAuthenticated {
            do {
                let candidates = try await gmailService.fetchPotentialTasks()
                // Store candidates for user review (not auto-import)
                await MainActor.run {
                    pendingEmailTasks = candidates
                }
            } catch {
                errors.append("Gmail: \(error.localizedDescription)")
            }
        }

        if !errors.isEmpty {
            await MainActor.run {
                syncError = errors.joined(separator: "\n")
            }
        }
    }

    // Email tasks pending user approval
    @Published var pendingEmailTasks: [EmailTaskCandidate] = []

    /// Import a suggested task from email
    func importEmailTask(_ candidate: EmailTaskCandidate, to dataController: DataController) {
        let task = TaskItem(
            title: candidate.suggestedTask.title,
            description: "Uit email: \(candidate.subject)",
            category: candidate.suggestedTask.category,
            priority: candidate.suggestedTask.priority,
            dueDate: candidate.suggestedTask.dueDate,
            importSource: .gmail,
            sourceReference: candidate.id
        )

        dataController.addTask(task)
        pendingEmailTasks.removeAll { $0.id == candidate.id }
    }

    /// Dismiss a suggested task
    func dismissEmailTask(_ candidate: EmailTaskCandidate) {
        pendingEmailTasks.removeAll { $0.id == candidate.id }
    }
}

// MARK: - WhatsApp Integration

/// WhatsApp Integration via Share Extension
/// Since WhatsApp doesn't have a public API, integration works through:
/// 1. Share Extension - receive shared text/links from WhatsApp
/// 2. Deep Links - open WhatsApp with pre-filled message
/// 3. Copy/Paste detection - smart paste recognition
///
/// To implement Share Extension:
/// 1. Add new target: File > New > Target > Share Extension
/// 2. Configure App Groups for data sharing
/// 3. Parse incoming content and create tasks/events

class WhatsAppIntegration {

    /// Parse shared text from WhatsApp for potential tasks
    static func parseSharedText(_ text: String) -> ParsedContent? {
        // Common patterns in WhatsApp messages
        let datePatterns = [
            // Dutch date formats
            #"(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})"#,
            #"(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)"#,
            #"(morgen|overmorgen|vandaag|volgende week)"#,
            // Time patterns
            #"(\d{1,2}[:.]\d{2})\s*(uur)?"#,
            #"om\s+(\d{1,2})\s*(uur)?"#
        ]

        let actionPatterns = [
            "vergeet niet",
            "herinnering",
            "afspraak",
            "meeting",
            "bellen",
            "mailen",
            "kopen",
            "halen",
            "brengen",
            "doen",
            "maken"
        ]

        var suggestedTitle: String?
        var suggestedDate: Date?
        var isEvent = false

        // Check for action keywords
        for pattern in actionPatterns {
            if text.lowercased().contains(pattern) {
                // Extract the relevant part as title
                let lines = text.components(separatedBy: "\n")
                if let actionLine = lines.first(where: { $0.lowercased().contains(pattern) }) {
                    suggestedTitle = actionLine.trimmingCharacters(in: .whitespacesAndNewlines)
                }
                break
            }
        }

        // Check for date/time mentions
        for pattern in datePatterns {
            if let _ = text.range(of: pattern, options: .regularExpression, range: nil, locale: nil) {
                isEvent = true
                // Would parse actual date here with DateFormatter
                suggestedDate = Calendar.current.date(byAdding: .day, value: 1, to: Date())
                break
            }
        }

        if let title = suggestedTitle {
            return ParsedContent(
                originalText: text,
                suggestedTitle: title,
                suggestedDate: suggestedDate,
                isLikelyEvent: isEvent
            )
        }

        return nil
    }

    /// Create a shareable link to send via WhatsApp
    static func createShareLink(for task: TaskItem) -> URL? {
        var message = "TaskFlow: \(task.title)"
        if let dueDate = task.formattedDueDate {
            message += "\nDeadline: \(dueDate)"
        }
        if !task.description.isEmpty {
            message += "\n\(task.description)"
        }

        let encoded = message.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        return URL(string: "whatsapp://send?text=\(encoded)")
    }

    /// Check if WhatsApp is installed
    static var isWhatsAppInstalled: Bool {
        guard let url = URL(string: "whatsapp://") else { return false }
        return UIApplication.shared.canOpenURL(url)
    }

    /// Open WhatsApp with pre-filled message
    static func shareToWhatsApp(message: String) {
        let encoded = message.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        if let url = URL(string: "whatsapp://send?text=\(encoded)") {
            UIApplication.shared.open(url)
        }
    }
}

struct ParsedContent {
    let originalText: String
    let suggestedTitle: String
    let suggestedDate: Date?
    let isLikelyEvent: Bool
}

// MARK: - Integrations View

struct IntegrationsView: View {
    @EnvironmentObject var dataController: DataController
    @StateObject private var integrationManager = IntegrationManager.shared

    var body: some View {
        NavigationStack {
            List {
                // Sync Status
                Section {
                    if let lastSync = integrationManager.lastFullSync {
                        HStack {
                            Label("Laatste sync", systemImage: "arrow.triangle.2.circlepath")
                            Spacer()
                            Text(lastSync, style: .relative)
                                .foregroundColor(.secondary)
                        }
                    }

                    Button(action: {
                        Task {
                            await integrationManager.syncAll(with: dataController)
                        }
                    }) {
                        HStack {
                            Label("Synchroniseer nu", systemImage: "arrow.clockwise")
                            Spacer()
                            if integrationManager.isSyncing {
                                ProgressView()
                            }
                        }
                    }
                    .disabled(integrationManager.isSyncing)
                }

                // Gmail
                Section {
                    IntegrationRow(
                        title: "Gmail",
                        icon: "envelope.fill",
                        color: .red,
                        isConnected: integrationManager.gmailService.isAuthenticated,
                        connectedEmail: integrationManager.gmailService.userEmail
                    ) {
                        if integrationManager.gmailService.isAuthenticated {
                            integrationManager.gmailService.signOut()
                        } else {
                            Task {
                                try? await integrationManager.gmailService.signIn()
                            }
                        }
                    }
                } header: {
                    Text("E-mail")
                } footer: {
                    Text("Importeer taken en afspraken uit je e-mails")
                }

                // Outlook
                Section {
                    IntegrationRow(
                        title: "Outlook / Microsoft 365",
                        icon: "calendar.badge.clock",
                        color: .blue,
                        isConnected: integrationManager.outlookService.isAuthenticated,
                        connectedEmail: integrationManager.outlookService.userEmail
                    ) {
                        if integrationManager.outlookService.isAuthenticated {
                            integrationManager.outlookService.signOut()
                        } else {
                            Task {
                                try? await integrationManager.outlookService.signIn()
                            }
                        }
                    }
                } header: {
                    Text("Agenda")
                } footer: {
                    Text("Synchroniseer je Outlook agenda en Microsoft To Do")
                }

                // WhatsApp
                Section {
                    WhatsAppIntegrationRow()
                } header: {
                    Text("Berichten")
                } footer: {
                    Text("Deel berichten uit WhatsApp naar TaskFlow via de iOS deelfunctie")
                }

                // Pending imports
                if !integrationManager.pendingEmailTasks.isEmpty {
                    Section("In behandeling") {
                        ForEach(integrationManager.pendingEmailTasks) { candidate in
                            PendingTaskRow(candidate: candidate) {
                                integrationManager.importEmailTask(candidate, to: dataController)
                            } onDismiss: {
                                integrationManager.dismissEmailTask(candidate)
                            }
                        }
                    }
                }

                // Info section
                Section {
                    NavigationLink {
                        IntegrationHelpView()
                    } label: {
                        Label("Hoe werken integraties?", systemImage: "questionmark.circle")
                    }
                }
            }
            .navigationTitle("Integraties")
        }
    }
}

struct IntegrationRow: View {
    let title: String
    let icon: String
    let color: Color
    let isConnected: Bool
    let connectedEmail: String?
    let action: () -> Void

    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
                .frame(width: 40)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .fontWeight(.medium)

                if let email = connectedEmail {
                    Text(email)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            Button(action: action) {
                Text(isConnected ? "Ontkoppel" : "Verbind")
                    .font(.subheadline)
                    .foregroundColor(isConnected ? .red : .blue)
            }
        }
        .padding(.vertical, 4)
    }
}

struct WhatsAppIntegrationRow: View {
    var body: some View {
        HStack {
            Image(systemName: "message.fill")
                .font(.title2)
                .foregroundColor(.green)
                .frame(width: 40)

            VStack(alignment: .leading, spacing: 2) {
                Text("WhatsApp")
                    .fontWeight(.medium)

                Text(WhatsAppIntegration.isWhatsAppInstalled ? "Geïnstalleerd" : "Niet geïnstalleerd")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            if WhatsAppIntegration.isWhatsAppInstalled {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
            }
        }
        .padding(.vertical, 4)
    }
}

struct PendingTaskRow: View {
    let candidate: EmailTaskCandidate
    let onImport: () -> Void
    let onDismiss: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "envelope")
                    .foregroundColor(.red)
                Text(candidate.subject)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .lineLimit(1)
            }

            Text(candidate.snippet)
                .font(.caption)
                .foregroundColor(.secondary)
                .lineLimit(2)

            HStack {
                Text("Voorgesteld: \(candidate.suggestedTask.title)")
                    .font(.caption)
                    .foregroundColor(.blue)

                Spacer()

                Button("Negeer", action: onDismiss)
                    .font(.caption)
                    .foregroundColor(.secondary)

                Button("Importeer", action: onImport)
                    .font(.caption)
                    .fontWeight(.medium)
            }
        }
        .padding(.vertical, 4)
    }
}

struct IntegrationHelpView: View {
    var body: some View {
        List {
            Section("Gmail") {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Met Gmail integratie kun je:")
                        .fontWeight(.medium)
                    Text("• E-mails met actiepunten detecteren")
                    Text("• Vergaderverzoeken importeren")
                    Text("• Deadlines uit e-mails halen")
                }
            }

            Section("Outlook") {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Met Outlook integratie kun je:")
                        .fontWeight(.medium)
                    Text("• Je werkagenda synchroniseren")
                    Text("• Microsoft To Do taken importeren")
                    Text("• Teams meetings zien")
                }
            }

            Section("WhatsApp") {
                VStack(alignment: .leading, spacing: 8) {
                    Text("WhatsApp integratie werkt via iOS delen:")
                        .fontWeight(.medium)
                    Text("1. Open een WhatsApp bericht")
                    Text("2. Tik op het bericht en kies 'Deel'")
                    Text("3. Selecteer TaskFlow")
                    Text("4. Het bericht wordt omgezet naar een taak")
                }
            }

            Section("Privacy") {
                Text("Je gegevens blijven op je apparaat. Externe services worden alleen gelezen, nooit gewijzigd.")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .navigationTitle("Hulp bij integraties")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    IntegrationsView()
        .environmentObject(DataController.shared)
}
