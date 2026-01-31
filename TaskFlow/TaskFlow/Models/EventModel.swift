import Foundation
import SwiftUI

struct CalendarEvent: Identifiable, Codable, Hashable {
    var id: UUID
    var title: String
    var description: String
    var category: TaskCategory
    var startDate: Date
    var endDate: Date
    var isAllDay: Bool
    var location: String?
    var importSource: ImportSource
    var sourceReference: String?
    var color: String
    var reminderMinutesBefore: Int?
    var recurrence: EventRecurrence?
    var attendees: [String]

    init(
        id: UUID = UUID(),
        title: String,
        description: String = "",
        category: TaskCategory = .personal,
        startDate: Date,
        endDate: Date? = nil,
        isAllDay: Bool = false,
        location: String? = nil,
        importSource: ImportSource = .manual,
        sourceReference: String? = nil,
        color: String? = nil,
        reminderMinutesBefore: Int? = 15,
        recurrence: EventRecurrence? = nil,
        attendees: [String] = []
    ) {
        self.id = id
        self.title = title
        self.description = description
        self.category = category
        self.startDate = startDate
        self.endDate = endDate ?? Calendar.current.date(byAdding: .hour, value: 1, to: startDate)!
        self.isAllDay = isAllDay
        self.location = location
        self.importSource = importSource
        self.sourceReference = sourceReference
        self.color = color ?? category.color.description
        self.reminderMinutesBefore = reminderMinutesBefore
        self.recurrence = recurrence
        self.attendees = attendees
    }

    var duration: TimeInterval {
        endDate.timeIntervalSince(startDate)
    }

    var formattedTimeRange: String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "nl_NL")

        if isAllDay {
            return "Hele dag"
        }

        formatter.timeStyle = .short
        let start = formatter.string(from: startDate)
        let end = formatter.string(from: endDate)
        return "\(start) - \(end)"
    }

    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "nl_NL")
        formatter.dateStyle = .full
        return formatter.string(from: startDate)
    }

    var isHappeningNow: Bool {
        let now = Date()
        return startDate <= now && endDate >= now
    }

    var isUpcoming: Bool {
        return startDate > Date()
    }

    var isPast: Bool {
        return endDate < Date()
    }
}

enum EventRecurrence: String, CaseIterable, Codable {
    case daily = "Dagelijks"
    case weekly = "Wekelijks"
    case biweekly = "Tweewekelijks"
    case monthly = "Maandelijks"
    case yearly = "Jaarlijks"

    var calendarComponent: Calendar.Component {
        switch self {
        case .daily: return .day
        case .weekly, .biweekly: return .weekOfYear
        case .monthly: return .month
        case .yearly: return .year
        }
    }

    var value: Int {
        switch self {
        case .biweekly: return 2
        default: return 1
        }
    }
}

extension CalendarEvent {
    static let sampleEvents: [CalendarEvent] = [
        CalendarEvent(
            title: "Teammeeting",
            description: "Wekelijkse standup",
            category: .work,
            startDate: Calendar.current.date(bySettingHour: 9, minute: 0, second: 0, of: Date())!,
            endDate: Calendar.current.date(bySettingHour: 10, minute: 0, second: 0, of: Date())!,
            location: "Vergaderzaal A",
            recurrence: .weekly
        ),
        CalendarEvent(
            title: "Lunch met vrienden",
            description: "Bij het Italiaanse restaurant",
            category: .personal,
            startDate: Calendar.current.date(bySettingHour: 12, minute: 30, second: 0, of: Date())!,
            endDate: Calendar.current.date(bySettingHour: 14, minute: 0, second: 0, of: Date())!,
            location: "La Piazza"
        ),
        CalendarEvent(
            title: "Project deadline",
            category: .work,
            startDate: Calendar.current.date(byAdding: .day, value: 3, to: Date())!,
            isAllDay: true,
            importSource: .outlook
        ),
        CalendarEvent(
            title: "Verjaardag mama",
            category: .personal,
            startDate: Calendar.current.date(byAdding: .day, value: 5, to: Date())!,
            isAllDay: true,
            recurrence: .yearly
        )
    ]
}
