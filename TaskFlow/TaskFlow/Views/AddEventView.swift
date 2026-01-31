import SwiftUI

struct AddEventView: View {
    @EnvironmentObject var dataController: DataController
    @Environment(\.dismiss) private var dismiss

    let category: TaskCategory

    @State private var title = ""
    @State private var description = ""
    @State private var selectedCategory: TaskCategory
    @State private var isAllDay = false
    @State private var startDate = Date()
    @State private var endDate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
    @State private var location = ""
    @State private var hasReminder = true
    @State private var reminderMinutes = 15
    @State private var recurrence: EventRecurrence?
    @State private var attendees: [String] = []
    @State private var newAttendee = ""

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
                    TextField("Titel afspraak", text: $title)
                        .font(.headline)
                        .focused($titleFocused)

                    TextField("Beschrijving (optioneel)", text: $description, axis: .vertical)
                        .lineLimit(3...6)
                }

                // Category
                Section {
                    Picker("Categorie", selection: $selectedCategory) {
                        ForEach(TaskCategory.allCases, id: \.self) { cat in
                            Label(cat.rawValue, systemImage: cat.icon)
                                .tag(cat)
                        }
                    }
                }

                // Time
                Section("Tijd") {
                    Toggle("Hele dag", isOn: $isAllDay.animation())

                    if isAllDay {
                        DatePicker("Datum", selection: $startDate, displayedComponents: .date)
                    } else {
                        DatePicker("Start", selection: $startDate)
                            .onChange(of: startDate) { _, newValue in
                                if endDate <= newValue {
                                    endDate = Calendar.current.date(byAdding: .hour, value: 1, to: newValue)!
                                }
                            }

                        DatePicker("Einde", selection: $endDate, in: startDate...)
                    }

                    // Quick time presets
                    if !isAllDay {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                DurationButton(title: "30 min", minutes: 30) { setDuration($0) }
                                DurationButton(title: "1 uur", minutes: 60) { setDuration($0) }
                                DurationButton(title: "1.5 uur", minutes: 90) { setDuration($0) }
                                DurationButton(title: "2 uur", minutes: 120) { setDuration($0) }
                            }
                        }
                    }
                }

                // Location
                Section("Locatie") {
                    TextField("Locatie toevoegen", text: $location)
                }

                // Reminder
                Section("Herinnering") {
                    Toggle("Herinnering", isOn: $hasReminder.animation())

                    if hasReminder {
                        Picker("Herinner me", selection: $reminderMinutes) {
                            Text("Op tijd").tag(0)
                            Text("5 minuten ervoor").tag(5)
                            Text("15 minuten ervoor").tag(15)
                            Text("30 minuten ervoor").tag(30)
                            Text("1 uur ervoor").tag(60)
                            Text("1 dag ervoor").tag(1440)
                        }
                    }
                }

                // Recurrence
                Section("Herhaling") {
                    Picker("Herhalen", selection: $recurrence) {
                        Text("Nooit").tag(nil as EventRecurrence?)
                        ForEach(EventRecurrence.allCases, id: \.self) { rec in
                            Text(rec.rawValue).tag(rec as EventRecurrence?)
                        }
                    }
                }

                // Attendees
                Section("Deelnemers") {
                    HStack {
                        TextField("E-mail toevoegen", text: $newAttendee)
                            .textInputAutocapitalization(.never)
                            .keyboardType(.emailAddress)

                        Button(action: addAttendee) {
                            Image(systemName: "plus.circle.fill")
                                .foregroundColor(selectedCategory.accentColor)
                        }
                        .disabled(newAttendee.isEmpty || !isValidEmail(newAttendee))
                    }

                    ForEach(attendees, id: \.self) { attendee in
                        HStack {
                            Image(systemName: "person.circle")
                                .foregroundColor(.secondary)
                            Text(attendee)

                            Spacer()

                            Button(action: { attendees.removeAll { $0 == attendee } }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Nieuwe afspraak")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Annuleer") { dismiss() }
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button("Voeg toe") {
                        saveEvent()
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

    private func setDuration(_ minutes: Int) {
        endDate = Calendar.current.date(byAdding: .minute, value: minutes, to: startDate)!
    }

    private func addAttendee() {
        let trimmed = newAttendee.trimmingCharacters(in: .whitespaces)
        if !trimmed.isEmpty && !attendees.contains(trimmed) && isValidEmail(trimmed) {
            attendees.append(trimmed)
            newAttendee = ""
        }
    }

    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = #"^[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"#
        return email.range(of: emailRegex, options: .regularExpression) != nil
    }

    private func saveEvent() {
        let event = CalendarEvent(
            title: title.trimmingCharacters(in: .whitespaces),
            description: description.trimmingCharacters(in: .whitespaces),
            category: selectedCategory,
            startDate: startDate,
            endDate: isAllDay ? startDate : endDate,
            isAllDay: isAllDay,
            location: location.isEmpty ? nil : location,
            reminderMinutesBefore: hasReminder ? reminderMinutes : nil,
            recurrence: recurrence,
            attendees: attendees
        )

        dataController.addEvent(event)
        dismiss()
    }
}

struct DurationButton: View {
    let title: String
    let minutes: Int
    let action: (Int) -> Void

    var body: some View {
        Button(action: { action(minutes) }) {
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

#Preview {
    AddEventView(category: .personal)
        .environmentObject(DataController.shared)
}
