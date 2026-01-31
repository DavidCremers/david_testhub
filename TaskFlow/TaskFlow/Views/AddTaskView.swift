import SwiftUI

struct AddTaskView: View {
    @EnvironmentObject var dataController: DataController
    @Environment(\.dismiss) private var dismiss

    let category: TaskCategory

    @State private var title = ""
    @State private var description = ""
    @State private var selectedCategory: TaskCategory
    @State private var priority: TaskPriority = .medium
    @State private var hasDueDate = false
    @State private var dueDate = Date()
    @State private var hasReminder = false
    @State private var reminderDate = Date()
    @State private var tags: [String] = []
    @State private var newTag = ""

    @FocusState private var titleFocused: Bool

    init(category: TaskCategory) {
        self.category = category
        _selectedCategory = State(initialValue: category)
    }

    var isValid: Bool {
        !title.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        NavigationStack {
            Form {
                // Basic Info
                Section {
                    TextField("Wat moet je doen?", text: $title)
                        .font(.headline)
                        .focused($titleFocused)

                    TextField("Beschrijving (optioneel)", text: $description, axis: .vertical)
                        .lineLimit(3...6)
                }

                // Category & Priority
                Section {
                    Picker("Categorie", selection: $selectedCategory) {
                        ForEach(TaskCategory.allCases, id: \.self) { cat in
                            Label(cat.rawValue, systemImage: cat.icon)
                                .tag(cat)
                        }
                    }

                    Picker("Prioriteit", selection: $priority) {
                        ForEach(TaskPriority.allCases, id: \.self) { pri in
                            HStack {
                                Image(systemName: pri.icon)
                                    .foregroundColor(pri.color)
                                Text(pri.rawValue)
                            }
                            .tag(pri)
                        }
                    }
                }

                // Due Date
                Section {
                    Toggle("Deadline instellen", isOn: $hasDueDate.animation())

                    if hasDueDate {
                        DatePicker(
                            "Deadline",
                            selection: $dueDate,
                            in: Date()...,
                            displayedComponents: [.date, .hourAndMinute]
                        )

                        // Quick date buttons
                        HStack(spacing: 8) {
                            QuickDateButton(title: "Vandaag", date: Date()) { dueDate = $0 }
                            QuickDateButton(title: "Morgen", date: Calendar.current.date(byAdding: .day, value: 1, to: Date())!) { dueDate = $0 }
                            QuickDateButton(title: "Volgende week", date: Calendar.current.date(byAdding: .weekOfYear, value: 1, to: Date())!) { dueDate = $0 }
                        }
                        .padding(.vertical, 4)
                    }
                }

                // Reminder
                Section {
                    Toggle("Herinnering", isOn: $hasReminder.animation())

                    if hasReminder && hasDueDate {
                        Picker("Herinnering", selection: $reminderDate) {
                            Text("Op deadline").tag(dueDate)
                            Text("15 min ervoor").tag(Calendar.current.date(byAdding: .minute, value: -15, to: dueDate)!)
                            Text("1 uur ervoor").tag(Calendar.current.date(byAdding: .hour, value: -1, to: dueDate)!)
                            Text("1 dag ervoor").tag(Calendar.current.date(byAdding: .day, value: -1, to: dueDate)!)
                        }
                    }
                }

                // Tags
                Section("Tags") {
                    HStack {
                        TextField("Nieuwe tag", text: $newTag)
                            .textInputAutocapitalization(.never)

                        Button(action: addTag) {
                            Image(systemName: "plus.circle.fill")
                                .foregroundColor(selectedCategory.accentColor)
                        }
                        .disabled(newTag.isEmpty)
                    }

                    if !tags.isEmpty {
                        FlowLayout(spacing: 8) {
                            ForEach(tags, id: \.self) { tag in
                                TagChip(tag: tag, color: selectedCategory.accentColor) {
                                    tags.removeAll { $0 == tag }
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Nieuwe taak")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Annuleer") { dismiss() }
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button("Voeg toe") {
                        saveTask()
                    }
                    .fontWeight(.semibold)
                    .disabled(!isValid)
                }
            }
            .onAppear {
                titleFocused = true
            }
        }
    }

    private func addTag() {
        let trimmed = newTag.trimmingCharacters(in: .whitespaces)
        if !trimmed.isEmpty && !tags.contains(trimmed) {
            tags.append(trimmed)
            newTag = ""
        }
    }

    private func saveTask() {
        let task = TaskItem(
            title: title.trimmingCharacters(in: .whitespaces),
            description: description.trimmingCharacters(in: .whitespaces),
            category: selectedCategory,
            priority: priority,
            dueDate: hasDueDate ? dueDate : nil,
            tags: tags,
            reminderDate: hasReminder && hasDueDate ? reminderDate : nil
        )

        dataController.addTask(task)
        dismiss()
    }
}

// MARK: - Helper Views

struct QuickDateButton: View {
    let title: String
    let date: Date
    let action: (Date) -> Void

    var body: some View {
        Button(action: { action(date) }) {
            Text(title)
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color(.systemGray5))
                .cornerRadius(8)
        }
        .buttonStyle(.plain)
    }
}

struct TagChip: View {
    let tag: String
    let color: Color
    let onRemove: () -> Void

    var body: some View {
        HStack(spacing: 4) {
            Text(tag)
                .font(.caption)

            Button(action: onRemove) {
                Image(systemName: "xmark.circle.fill")
                    .font(.caption)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(color.opacity(0.15))
        .foregroundColor(color)
        .cornerRadius(16)
    }
}

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(in: proposal.width ?? 0, subviews: subviews, spacing: spacing)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(in: bounds.width, subviews: subviews, spacing: spacing)

        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: bounds.minX + result.positions[index].x,
                                     y: bounds.minY + result.positions[index].y),
                         proposal: .unspecified)
        }
    }

    struct FlowResult {
        var size: CGSize = .zero
        var positions: [CGPoint] = []

        init(in maxWidth: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var x: CGFloat = 0
            var y: CGFloat = 0
            var lineHeight: CGFloat = 0

            for subview in subviews {
                let size = subview.sizeThatFits(.unspecified)

                if x + size.width > maxWidth && x > 0 {
                    x = 0
                    y += lineHeight + spacing
                    lineHeight = 0
                }

                positions.append(CGPoint(x: x, y: y))
                lineHeight = max(lineHeight, size.height)
                x += size.width + spacing
            }

            self.size = CGSize(width: maxWidth, height: y + lineHeight)
        }
    }
}

#Preview {
    AddTaskView(category: .work)
        .environmentObject(DataController.shared)
}
