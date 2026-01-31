import SwiftUI

struct HomeView: View {
    @EnvironmentObject var dataController: DataController
    @Binding var selectedCategory: TaskCategory
    @State private var showAddTask = false
    @State private var showAddEvent = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Category Selector
                    CategorySelectorView(selectedCategory: $selectedCategory)

                    // Quick Stats
                    QuickStatsView(category: selectedCategory)

                    // Today's Overview
                    TodayOverviewSection(category: selectedCategory)

                    // Upcoming Events
                    UpcomingEventsSection(category: selectedCategory)

                    // Quick Actions
                    QuickActionsSection(
                        showAddTask: $showAddTask,
                        showAddEvent: $showAddEvent
                    )
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("TaskFlow")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Button(action: { showAddTask = true }) {
                            Label("Nieuwe taak", systemImage: "checklist")
                        }
                        Button(action: { showAddEvent = true }) {
                            Label("Nieuw agendapunt", systemImage: "calendar.badge.plus")
                        }
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                            .foregroundColor(selectedCategory.accentColor)
                    }
                }
            }
            .sheet(isPresented: $showAddTask) {
                AddTaskView(category: selectedCategory)
            }
            .sheet(isPresented: $showAddEvent) {
                AddEventView(category: selectedCategory)
            }
        }
    }
}

// MARK: - Category Selector

struct CategorySelectorView: View {
    @Binding var selectedCategory: TaskCategory

    var body: some View {
        HStack(spacing: 12) {
            ForEach(TaskCategory.allCases, id: \.self) { category in
                CategoryButton(
                    category: category,
                    isSelected: selectedCategory == category
                ) {
                    withAnimation(.spring(response: 0.3)) {
                        selectedCategory = category
                    }
                }
            }
        }
    }
}

struct CategoryButton: View {
    let category: TaskCategory
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: category.icon)
                Text(category.rawValue)
                    .fontWeight(.medium)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(isSelected ? category.accentColor : Color(.systemBackground))
            .foregroundColor(isSelected ? .white : .primary)
            .cornerRadius(12)
            .shadow(color: isSelected ? category.accentColor.opacity(0.3) : .clear, radius: 8, y: 4)
        }
    }
}

// MARK: - Quick Stats

struct QuickStatsView: View {
    @EnvironmentObject var dataController: DataController
    let category: TaskCategory

    var stats: TaskStatistics {
        dataController.taskStatistics(for: category)
    }

    var body: some View {
        HStack(spacing: 12) {
            StatCard(
                title: "Te doen",
                value: "\(stats.pending)",
                icon: "checklist",
                color: category.accentColor
            )

            StatCard(
                title: "Vandaag",
                value: "\(stats.dueToday)",
                icon: "calendar",
                color: .orange
            )

            StatCard(
                title: "Verlopen",
                value: "\(stats.overdue)",
                icon: "exclamationmark.triangle",
                color: stats.overdue > 0 ? .red : .gray
            )

            StatCard(
                title: "Voltooid",
                value: "\(Int(stats.completionRate * 100))%",
                icon: "checkmark.circle",
                color: .green
            )
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)

            Text(value)
                .font(.title2)
                .fontWeight(.bold)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(Color(.systemBackground))
        .cornerRadius(12)
    }
}

// MARK: - Today's Overview

struct TodayOverviewSection: View {
    @EnvironmentObject var dataController: DataController
    let category: TaskCategory

    var todayTasks: [TaskItem] {
        dataController.tasksDueToday(for: category)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Vandaag", icon: "sun.max.fill")

            if todayTasks.isEmpty {
                EmptyStateCard(
                    message: "Geen taken voor vandaag",
                    icon: "checkmark.circle"
                )
            } else {
                ForEach(todayTasks.prefix(3)) { task in
                    TaskRowCompact(task: task)
                }

                if todayTasks.count > 3 {
                    Text("+ \(todayTasks.count - 3) meer")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(.top, 4)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
    }
}

struct TaskRowCompact: View {
    @EnvironmentObject var dataController: DataController
    let task: TaskItem

    var body: some View {
        HStack(spacing: 12) {
            Button(action: {
                withAnimation {
                    dataController.toggleTaskCompletion(task)
                }
            }) {
                Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundColor(task.isCompleted ? .green : task.priority.color)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(task.title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .strikethrough(task.isCompleted)
                    .foregroundColor(task.isCompleted ? .secondary : .primary)

                if let formattedDate = task.formattedDueDate {
                    Text(formattedDate)
                        .font(.caption)
                        .foregroundColor(task.isOverdue ? .red : .secondary)
                }
            }

            Spacer()

            Image(systemName: task.priority.icon)
                .font(.caption)
                .foregroundColor(task.priority.color)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Upcoming Events

struct UpcomingEventsSection: View {
    @EnvironmentObject var dataController: DataController
    let category: TaskCategory

    var upcomingEvents: [CalendarEvent] {
        dataController.upcomingEvents(for: category)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Komende afspraken", icon: "calendar")

            if upcomingEvents.isEmpty {
                EmptyStateCard(
                    message: "Geen komende afspraken",
                    icon: "calendar"
                )
            } else {
                ForEach(upcomingEvents.prefix(3)) { event in
                    EventRowCompact(event: event)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
    }
}

struct EventRowCompact: View {
    let event: CalendarEvent

    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 4)
                .fill(event.category.accentColor)
                .frame(width: 4)
                .frame(height: 40)

            VStack(alignment: .leading, spacing: 2) {
                Text(event.title)
                    .font(.subheadline)
                    .fontWeight(.medium)

                HStack(spacing: 4) {
                    Text(event.formattedTimeRange)
                    if let location = event.location {
                        Text("•")
                        Text(location)
                    }
                }
                .font(.caption)
                .foregroundColor(.secondary)
            }

            Spacer()

            if event.importSource != .manual {
                Image(systemName: event.importSource.icon)
                    .font(.caption)
                    .foregroundColor(event.importSource.color)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Quick Actions

struct QuickActionsSection: View {
    @Binding var showAddTask: Bool
    @Binding var showAddEvent: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Snel toevoegen", icon: "bolt.fill")

            HStack(spacing: 12) {
                QuickActionButton(
                    title: "Taak",
                    icon: "checklist",
                    color: .blue
                ) {
                    showAddTask = true
                }

                QuickActionButton(
                    title: "Afspraak",
                    icon: "calendar.badge.plus",
                    color: .purple
                ) {
                    showAddEvent = true
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
    }
}

struct QuickActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)
            .background(color.opacity(0.1))
            .foregroundColor(color)
            .cornerRadius(12)
        }
    }
}

// MARK: - Helper Views

struct SectionHeader: View {
    let title: String
    let icon: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.secondary)
            Text(title)
                .font(.headline)
        }
    }
}

struct EmptyStateCard: View {
    let message: String
    let icon: String

    var body: some View {
        HStack {
            Spacer()
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(.secondary)
                Text(message)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding(.vertical, 20)
            Spacer()
        }
    }
}

#Preview {
    HomeView(selectedCategory: .constant(.work))
        .environmentObject(DataController.shared)
}
