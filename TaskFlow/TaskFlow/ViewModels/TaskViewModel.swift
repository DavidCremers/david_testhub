import Foundation
import SwiftUI

class TaskViewModel: ObservableObject {
    @Published var searchText = ""
    @Published var selectedPriority: TaskPriority?
    @Published var showCompleted = false
    @Published var sortOption: TaskSortOption = .dueDate

    enum TaskSortOption: String, CaseIterable {
        case dueDate = "Deadline"
        case priority = "Prioriteit"
        case title = "Titel"
        case createdAt = "Aangemaakt"

        var icon: String {
            switch self {
            case .dueDate: return "calendar"
            case .priority: return "flag"
            case .title: return "textformat"
            case .createdAt: return "clock"
            }
        }
    }

    func filterAndSort(tasks: [TaskItem], category: TaskCategory?) -> [TaskItem] {
        var filtered = tasks

        // Filter by category
        if let category = category {
            filtered = filtered.filter { $0.category == category }
        }

        // Filter by completion status
        if !showCompleted {
            filtered = filtered.filter { !$0.isCompleted }
        }

        // Filter by search text
        if !searchText.isEmpty {
            filtered = filtered.filter {
                $0.title.localizedCaseInsensitiveContains(searchText) ||
                $0.description.localizedCaseInsensitiveContains(searchText) ||
                $0.tags.contains { $0.localizedCaseInsensitiveContains(searchText) }
            }
        }

        // Filter by priority
        if let priority = selectedPriority {
            filtered = filtered.filter { $0.priority == priority }
        }

        // Sort
        filtered = sort(tasks: filtered)

        return filtered
    }

    private func sort(tasks: [TaskItem]) -> [TaskItem] {
        switch sortOption {
        case .dueDate:
            return tasks.sorted { task1, task2 in
                // Tasks without due date go to the end
                guard let date1 = task1.dueDate else { return false }
                guard let date2 = task2.dueDate else { return true }
                return date1 < date2
            }
        case .priority:
            return tasks.sorted { $0.priority.hashValue > $1.priority.hashValue }
        case .title:
            return tasks.sorted { $0.title.localizedCompare($1.title) == .orderedAscending }
        case .createdAt:
            return tasks.sorted { $0.createdAt > $1.createdAt }
        }
    }

    func groupByDate(tasks: [TaskItem]) -> [(String, [TaskItem])] {
        let calendar = Calendar.current
        var groups: [String: [TaskItem]] = [:]

        for task in tasks {
            let key: String
            if let dueDate = task.dueDate {
                if calendar.isDateInToday(dueDate) {
                    key = "Vandaag"
                } else if calendar.isDateInTomorrow(dueDate) {
                    key = "Morgen"
                } else if calendar.isDate(dueDate, equalTo: Date(), toGranularity: .weekOfYear) {
                    let formatter = DateFormatter()
                    formatter.locale = Locale(identifier: "nl_NL")
                    formatter.dateFormat = "EEEE"
                    key = formatter.string(from: dueDate).capitalized
                } else if dueDate < Date() {
                    key = "Verlopen"
                } else {
                    key = "Later"
                }
            } else {
                key = "Geen deadline"
            }

            if groups[key] == nil {
                groups[key] = []
            }
            groups[key]?.append(task)
        }

        // Define order
        let order = ["Verlopen", "Vandaag", "Morgen", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag", "Later", "Geen deadline"]

        return groups
            .sorted { order.firstIndex(of: $0.key) ?? 99 < order.firstIndex(of: $1.key) ?? 99 }
            .map { ($0.key, $0.value) }
    }
}
