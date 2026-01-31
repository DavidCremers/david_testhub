import Foundation
import CoreData
import SwiftUI

class DataController: ObservableObject {
    static let shared = DataController()

    let container: NSPersistentContainer

    @Published var tasks: [TaskItem] = []
    @Published var events: [CalendarEvent] = []

    private let tasksKey = "savedTasks"
    private let eventsKey = "savedEvents"

    init(inMemory: Bool = false) {
        container = NSPersistentContainer(name: "TaskFlow")

        if inMemory {
            container.persistentStoreDescriptions.first?.url = URL(fileURLWithPath: "/dev/null")
        }

        container.loadPersistentStores { description, error in
            if let error = error {
                print("Core Data failed to load: \(error.localizedDescription)")
            }
        }

        loadData()
    }

    // MARK: - Data Persistence

    private func loadData() {
        loadTasks()
        loadEvents()

        // Load sample data if empty (for demo purposes)
        if tasks.isEmpty {
            tasks = TaskItem.sampleTasks
            saveTasks()
        }
        if events.isEmpty {
            events = CalendarEvent.sampleEvents
            saveEvents()
        }
    }

    private func loadTasks() {
        if let data = UserDefaults.standard.data(forKey: tasksKey) {
            if let decoded = try? JSONDecoder().decode([TaskItem].self, from: data) {
                tasks = decoded
            }
        }
    }

    private func loadEvents() {
        if let data = UserDefaults.standard.data(forKey: eventsKey) {
            if let decoded = try? JSONDecoder().decode([CalendarEvent].self, from: data) {
                events = decoded
            }
        }
    }

    func saveTasks() {
        if let encoded = try? JSONEncoder().encode(tasks) {
            UserDefaults.standard.set(encoded, forKey: tasksKey)
        }
    }

    func saveEvents() {
        if let encoded = try? JSONEncoder().encode(events) {
            UserDefaults.standard.set(encoded, forKey: eventsKey)
        }
    }

    // MARK: - Task Operations

    func addTask(_ task: TaskItem) {
        tasks.append(task)
        saveTasks()
    }

    func updateTask(_ task: TaskItem) {
        if let index = tasks.firstIndex(where: { $0.id == task.id }) {
            tasks[index] = task
            saveTasks()
        }
    }

    func deleteTask(_ task: TaskItem) {
        tasks.removeAll { $0.id == task.id }
        saveTasks()
    }

    func toggleTaskCompletion(_ task: TaskItem) {
        if let index = tasks.firstIndex(where: { $0.id == task.id }) {
            tasks[index].isCompleted.toggle()
            tasks[index].completedAt = tasks[index].isCompleted ? Date() : nil
            saveTasks()
        }
    }

    func tasksForCategory(_ category: TaskCategory) -> [TaskItem] {
        tasks.filter { $0.category == category }
    }

    func incompleteTasks(for category: TaskCategory? = nil) -> [TaskItem] {
        if let category = category {
            return tasks.filter { !$0.isCompleted && $0.category == category }
        }
        return tasks.filter { !$0.isCompleted }
    }

    func completedTasks(for category: TaskCategory? = nil) -> [TaskItem] {
        if let category = category {
            return tasks.filter { $0.isCompleted && $0.category == category }
        }
        return tasks.filter { $0.isCompleted }
    }

    func tasksDueToday(for category: TaskCategory? = nil) -> [TaskItem] {
        let today = incompleteTasks(for: category).filter { $0.isDueToday }
        return today.sorted { ($0.priority.hashValue) > ($1.priority.hashValue) }
    }

    func overdueTasks(for category: TaskCategory? = nil) -> [TaskItem] {
        incompleteTasks(for: category).filter { $0.isOverdue }
    }

    // MARK: - Event Operations

    func addEvent(_ event: CalendarEvent) {
        events.append(event)
        saveEvents()
    }

    func updateEvent(_ event: CalendarEvent) {
        if let index = events.firstIndex(where: { $0.id == event.id }) {
            events[index] = event
            saveEvents()
        }
    }

    func deleteEvent(_ event: CalendarEvent) {
        events.removeAll { $0.id == event.id }
        saveEvents()
    }

    func eventsForCategory(_ category: TaskCategory) -> [CalendarEvent] {
        events.filter { $0.category == category }
    }

    func eventsForDate(_ date: Date, category: TaskCategory? = nil) -> [CalendarEvent] {
        let calendar = Calendar.current
        var filtered = events.filter { event in
            calendar.isDate(event.startDate, inSameDayAs: date)
        }

        if let category = category {
            filtered = filtered.filter { $0.category == category }
        }

        return filtered.sorted { $0.startDate < $1.startDate }
    }

    func upcomingEvents(for category: TaskCategory? = nil, limit: Int = 5) -> [CalendarEvent] {
        var filtered = events.filter { $0.isUpcoming || $0.isHappeningNow }

        if let category = category {
            filtered = filtered.filter { $0.category == category }
        }

        return Array(filtered.sorted { $0.startDate < $1.startDate }.prefix(limit))
    }

    func todayEvents(for category: TaskCategory? = nil) -> [CalendarEvent] {
        eventsForDate(Date(), category: category)
    }

    // MARK: - Statistics

    func taskStatistics(for category: TaskCategory? = nil) -> TaskStatistics {
        let relevantTasks: [TaskItem]
        if let category = category {
            relevantTasks = tasksForCategory(category)
        } else {
            relevantTasks = tasks
        }

        let total = relevantTasks.count
        let completed = relevantTasks.filter { $0.isCompleted }.count
        let overdue = relevantTasks.filter { $0.isOverdue }.count
        let dueToday = relevantTasks.filter { $0.isDueToday && !$0.isCompleted }.count

        return TaskStatistics(
            total: total,
            completed: completed,
            overdue: overdue,
            dueToday: dueToday
        )
    }
}

struct TaskStatistics {
    let total: Int
    let completed: Int
    let overdue: Int
    let dueToday: Int

    var completionRate: Double {
        guard total > 0 else { return 0 }
        return Double(completed) / Double(total)
    }

    var pending: Int {
        total - completed
    }
}
