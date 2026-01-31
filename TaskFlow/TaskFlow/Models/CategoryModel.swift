import SwiftUI

enum TaskCategory: String, CaseIterable, Codable {
    case work = "Werk"
    case personal = "Privé"

    var color: Color {
        switch self {
        case .work:
            return .blue
        case .personal:
            return .purple
        }
    }

    var icon: String {
        switch self {
        case .work:
            return "briefcase.fill"
        case .personal:
            return "person.fill"
        }
    }

    var accentColor: Color {
        switch self {
        case .work:
            return Color(red: 0.2, green: 0.5, blue: 0.9)
        case .personal:
            return Color(red: 0.6, green: 0.3, blue: 0.8)
        }
    }
}

enum TaskPriority: String, CaseIterable, Codable {
    case low = "Laag"
    case medium = "Gemiddeld"
    case high = "Hoog"
    case urgent = "Urgent"

    var color: Color {
        switch self {
        case .low:
            return .gray
        case .medium:
            return .blue
        case .high:
            return .orange
        case .urgent:
            return .red
        }
    }

    var icon: String {
        switch self {
        case .low:
            return "arrow.down"
        case .medium:
            return "minus"
        case .high:
            return "arrow.up"
        case .urgent:
            return "exclamationmark.2"
        }
    }
}

enum ImportSource: String, CaseIterable, Codable {
    case manual = "Handmatig"
    case gmail = "Gmail"
    case outlook = "Outlook"
    case whatsapp = "WhatsApp"

    var icon: String {
        switch self {
        case .manual:
            return "hand.tap.fill"
        case .gmail:
            return "envelope.fill"
        case .outlook:
            return "calendar.badge.clock"
        case .whatsapp:
            return "message.fill"
        }
    }

    var color: Color {
        switch self {
        case .manual:
            return .gray
        case .gmail:
            return .red
        case .outlook:
            return .blue
        case .whatsapp:
            return .green
        }
    }
}
