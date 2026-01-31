import Foundation

struct TaskItem: Identifiable, Codable, Hashable {
    var id: UUID
    var title: String
    var description: String
    var category: TaskCategory
    var priority: TaskPriority
    var dueDate: Date?
    var isCompleted: Bool
    var createdAt: Date
    var completedAt: Date?
    var importSource: ImportSource
    var sourceReference: String?
    var tags: [String]
    var reminderDate: Date?

    init(
        id: UUID = UUID(),
        title: String,
        description: String = "",
        category: TaskCategory = .personal,
        priority: TaskPriority = .medium,
        dueDate: Date? = nil,
        isCompleted: Bool = false,
        createdAt: Date = Date(),
        completedAt: Date? = nil,
        importSource: ImportSource = .manual,
        sourceReference: String? = nil,
        tags: [String] = [],
        reminderDate: Date? = nil
    ) {
        self.id = id
        self.title = title
        self.description = description
        self.category = category
        self.priority = priority
        self.dueDate = dueDate
        self.isCompleted = isCompleted
        self.createdAt = createdAt
        self.completedAt = completedAt
        self.importSource = importSource
        self.sourceReference = sourceReference
        self.tags = tags
        self.reminderDate = reminderDate
    }

    var isOverdue: Bool {
        guard let dueDate = dueDate, !isCompleted else { return false }
        return dueDate < Date()
    }

    var isDueToday: Bool {
        guard let dueDate = dueDate else { return false }
        return Calendar.current.isDateInToday(dueDate)
    }

    var isDueTomorrow: Bool {
        guard let dueDate = dueDate else { return false }
        return Calendar.current.isDateInTomorrow(dueDate)
    }

    var formattedDueDate: String? {
        guard let dueDate = dueDate else { return nil }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "nl_NL")

        if isDueToday {
            return "Vandaag"
        } else if isDueTomorrow {
            return "Morgen"
        } else if Calendar.current.isDate(dueDate, equalTo: Date(), toGranularity: .weekOfYear) {
            formatter.dateFormat = "EEEE"
            return formatter.string(from: dueDate)
        } else {
            formatter.dateStyle = .medium
            return formatter.string(from: dueDate)
        }
    }
}

extension TaskItem {
    static let sampleTasks: [TaskItem] = [
        TaskItem(
            title: "Project presentatie voorbereiden",
            description: "Slides maken voor de kwartaalmeeting",
            category: .work,
            priority: .high,
            dueDate: Calendar.current.date(byAdding: .day, value: 2, to: Date())
        ),
        TaskItem(
            title: "Boodschappen doen",
            description: "Melk, brood, kaas, groenten",
            category: .personal,
            priority: .medium,
            dueDate: Date()
        ),
        TaskItem(
            title: "Teammeeting plannen",
            description: "Sprint planning voor volgende week",
            category: .work,
            priority: .medium,
            dueDate: Calendar.current.date(byAdding: .day, value: 1, to: Date())
        ),
        TaskItem(
            title: "Sportschool",
            description: "Cardio en krachttraining",
            category: .personal,
            priority: .low,
            dueDate: Calendar.current.date(byAdding: .day, value: 1, to: Date())
        ),
        TaskItem(
            title: "Code review",
            description: "Review PR #234 van collegae",
            category: .work,
            priority: .urgent,
            dueDate: Date(),
            importSource: .gmail,
            sourceReference: "email-123"
        )
    ]
}
