import SwiftUI

struct TaskListView: View {
    @EnvironmentObject var dataController: DataController
    @StateObject private var viewModel = TaskViewModel()
    @Binding var selectedCategory: TaskCategory

    @State private var showAddTask = false
    @State private var selectedTask: TaskItem?
    @State private var showFilters = false

    var filteredTasks: [TaskItem] {
        viewModel.filterAndSort(tasks: dataController.tasks, category: selectedCategory)
    }

    var groupedTasks: [(String, [TaskItem])] {
        viewModel.groupByDate(tasks: filteredTasks)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                if filteredTasks.isEmpty {
                    EmptyTasksView(showAddTask: $showAddTask)
                } else {
                    taskList
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Taken")
            .searchable(text: $viewModel.searchText, prompt: "Zoek taken...")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    CategoryPicker(selectedCategory: $selectedCategory)
                }

                ToolbarItem(placement: .topBarTrailing) {
                    HStack {
                        filterButton
                        addButton
                    }
                }
            }
            .sheet(isPresented: $showAddTask) {
                AddTaskView(category: selectedCategory)
            }
            .sheet(item: $selectedTask) { task in
                TaskDetailView(task: task)
            }
            .sheet(isPresented: $showFilters) {
                TaskFiltersView(viewModel: viewModel)
            }
        }
    }

    private var taskList: some View {
        List {
            ForEach(groupedTasks, id: \.0) { group, tasks in
                Section {
                    ForEach(tasks) { task in
                        TaskRowView(task: task)
                            .contentShape(Rectangle())
                            .onTapGesture {
                                selectedTask = task
                            }
                            .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                                Button(role: .destructive) {
                                    withAnimation {
                                        dataController.deleteTask(task)
                                    }
                                } label: {
                                    Label("Verwijder", systemImage: "trash")
                                }
                            }
                            .swipeActions(edge: .leading, allowsFullSwipe: true) {
                                Button {
                                    withAnimation {
                                        dataController.toggleTaskCompletion(task)
                                    }
                                } label: {
                                    Label(
                                        task.isCompleted ? "Ongedaan" : "Voltooid",
                                        systemImage: task.isCompleted ? "arrow.uturn.backward" : "checkmark"
                                    )
                                }
                                .tint(.green)
                            }
                    }
                } header: {
                    Text(group)
                        .font(.headline)
                        .foregroundColor(group == "Verlopen" ? .red : .secondary)
                }
            }
        }
        .listStyle(.insetGrouped)
    }

    private var filterButton: some View {
        Button(action: { showFilters = true }) {
            Image(systemName: viewModel.selectedPriority != nil ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                .foregroundColor(selectedCategory.accentColor)
        }
    }

    private var addButton: some View {
        Button(action: { showAddTask = true }) {
            Image(systemName: "plus.circle.fill")
                .foregroundColor(selectedCategory.accentColor)
        }
    }
}

// MARK: - Category Picker

struct CategoryPicker: View {
    @Binding var selectedCategory: TaskCategory

    var body: some View {
        Menu {
            ForEach(TaskCategory.allCases, id: \.self) { category in
                Button(action: { selectedCategory = category }) {
                    Label(category.rawValue, systemImage: category.icon)
                }
            }
        } label: {
            HStack(spacing: 4) {
                Image(systemName: selectedCategory.icon)
                Text(selectedCategory.rawValue)
                    .fontWeight(.medium)
                Image(systemName: "chevron.down")
                    .font(.caption)
            }
            .foregroundColor(selectedCategory.accentColor)
        }
    }
}

// MARK: - Task Row

struct TaskRowView: View {
    @EnvironmentObject var dataController: DataController
    let task: TaskItem

    var body: some View {
        HStack(spacing: 12) {
            // Completion button
            Button(action: {
                withAnimation(.spring(response: 0.3)) {
                    dataController.toggleTaskCompletion(task)
                }
            }) {
                ZStack {
                    Circle()
                        .stroke(task.isCompleted ? Color.green : task.priority.color, lineWidth: 2)
                        .frame(width: 24, height: 24)

                    if task.isCompleted {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 24, height: 24)

                        Image(systemName: "checkmark")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                    }
                }
            }
            .buttonStyle(.plain)

            // Task info
            VStack(alignment: .leading, spacing: 4) {
                Text(task.title)
                    .font(.body)
                    .fontWeight(.medium)
                    .strikethrough(task.isCompleted)
                    .foregroundColor(task.isCompleted ? .secondary : .primary)

                HStack(spacing: 8) {
                    // Due date
                    if let formattedDate = task.formattedDueDate {
                        Label(formattedDate, systemImage: "calendar")
                            .font(.caption)
                            .foregroundColor(task.isOverdue ? .red : .secondary)
                    }

                    // Import source
                    if task.importSource != .manual {
                        Label(task.importSource.rawValue, systemImage: task.importSource.icon)
                            .font(.caption)
                            .foregroundColor(task.importSource.color)
                    }
                }
            }

            Spacer()

            // Priority indicator
            VStack {
                Image(systemName: task.priority.icon)
                    .font(.caption)
                    .foregroundColor(task.priority.color)

                Text(task.priority.rawValue)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Empty State

struct EmptyTasksView: View {
    @Binding var showAddTask: Bool

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "checklist")
                .font(.system(size: 60))
                .foregroundColor(.secondary)

            Text("Geen taken")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Voeg je eerste taak toe om te beginnen")
                .font(.subheadline)
                .foregroundColor(.secondary)

            Button(action: { showAddTask = true }) {
                Label("Nieuwe taak", systemImage: "plus")
                    .fontWeight(.medium)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
            .padding(.top, 8)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Task Filters

struct TaskFiltersView: View {
    @ObservedObject var viewModel: TaskViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Sorteren") {
                    Picker("Sorteer op", selection: $viewModel.sortOption) {
                        ForEach(TaskViewModel.TaskSortOption.allCases, id: \.self) { option in
                            Label(option.rawValue, systemImage: option.icon)
                                .tag(option)
                        }
                    }
                }

                Section("Filteren") {
                    Toggle("Toon voltooide taken", isOn: $viewModel.showCompleted)

                    Picker("Prioriteit", selection: $viewModel.selectedPriority) {
                        Text("Alle").tag(nil as TaskPriority?)
                        ForEach(TaskPriority.allCases, id: \.self) { priority in
                            Label(priority.rawValue, systemImage: priority.icon)
                                .tag(priority as TaskPriority?)
                        }
                    }
                }

                Section {
                    Button("Reset filters") {
                        viewModel.selectedPriority = nil
                        viewModel.showCompleted = false
                        viewModel.sortOption = .dueDate
                    }
                    .foregroundColor(.red)
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Klaar") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium])
    }
}

// MARK: - Task Detail

struct TaskDetailView: View {
    @EnvironmentObject var dataController: DataController
    @Environment(\.dismiss) private var dismiss
    @State var task: TaskItem
    @State private var isEditing = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    if isEditing {
                        TextField("Titel", text: $task.title)
                        TextField("Beschrijving", text: $task.description, axis: .vertical)
                            .lineLimit(3...6)
                    } else {
                        Text(task.title)
                            .font(.headline)
                        if !task.description.isEmpty {
                            Text(task.description)
                                .foregroundColor(.secondary)
                        }
                    }
                }

                Section("Details") {
                    if isEditing {
                        Picker("Categorie", selection: $task.category) {
                            ForEach(TaskCategory.allCases, id: \.self) { category in
                                Label(category.rawValue, systemImage: category.icon)
                                    .tag(category)
                            }
                        }

                        Picker("Prioriteit", selection: $task.priority) {
                            ForEach(TaskPriority.allCases, id: \.self) { priority in
                                Label(priority.rawValue, systemImage: priority.icon)
                                    .tag(priority)
                            }
                        }

                        DatePicker(
                            "Deadline",
                            selection: Binding(
                                get: { task.dueDate ?? Date() },
                                set: { task.dueDate = $0 }
                            ),
                            displayedComponents: [.date, .hourAndMinute]
                        )
                    } else {
                        LabeledContent("Categorie") {
                            Label(task.category.rawValue, systemImage: task.category.icon)
                                .foregroundColor(task.category.accentColor)
                        }

                        LabeledContent("Prioriteit") {
                            Label(task.priority.rawValue, systemImage: task.priority.icon)
                                .foregroundColor(task.priority.color)
                        }

                        if let dueDate = task.dueDate {
                            LabeledContent("Deadline") {
                                Text(dueDate, style: .date)
                            }
                        }
                    }
                }

                if task.importSource != .manual {
                    Section("Bron") {
                        LabeledContent("Geïmporteerd van") {
                            Label(task.importSource.rawValue, systemImage: task.importSource.icon)
                                .foregroundColor(task.importSource.color)
                        }
                    }
                }

                Section {
                    Button(action: {
                        dataController.toggleTaskCompletion(task)
                        dismiss()
                    }) {
                        Label(
                            task.isCompleted ? "Markeer als niet voltooid" : "Markeer als voltooid",
                            systemImage: task.isCompleted ? "arrow.uturn.backward" : "checkmark.circle"
                        )
                    }
                    .foregroundColor(.green)

                    Button(role: .destructive, action: {
                        dataController.deleteTask(task)
                        dismiss()
                    }) {
                        Label("Verwijder taak", systemImage: "trash")
                    }
                }
            }
            .navigationTitle("Taak details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Annuleer") { dismiss() }
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button(isEditing ? "Opslaan" : "Bewerk") {
                        if isEditing {
                            dataController.updateTask(task)
                        }
                        isEditing.toggle()
                    }
                }
            }
        }
    }
}

#Preview {
    TaskListView(selectedCategory: .constant(.work))
        .environmentObject(DataController.shared)
}
