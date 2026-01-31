import SwiftUI

struct CalendarView: View {
    @EnvironmentObject var dataController: DataController
    @StateObject private var viewModel = EventViewModel()
    @Binding var selectedCategory: TaskCategory

    @State private var showAddEvent = false
    @State private var selectedEvent: CalendarEvent?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Calendar Header
                CalendarHeaderView(viewModel: viewModel)

                // View Mode Selector
                ViewModeSelector(viewModel: viewModel, category: selectedCategory)

                // Calendar Content
                Group {
                    switch viewModel.viewMode {
                    case .day:
                        DayView(viewModel: viewModel, category: selectedCategory, selectedEvent: $selectedEvent)
                    case .week:
                        WeekView(viewModel: viewModel, category: selectedCategory, selectedEvent: $selectedEvent)
                    case .month:
                        MonthView(viewModel: viewModel, category: selectedCategory, selectedEvent: $selectedEvent)
                    }
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Agenda")
            .searchable(text: $viewModel.searchText, prompt: "Zoek afspraken...")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    CategoryPicker(selectedCategory: $selectedCategory)
                }

                ToolbarItem(placement: .topBarTrailing) {
                    HStack {
                        Button(action: { viewModel.goToToday() }) {
                            Text("Vandaag")
                                .font(.subheadline)
                        }

                        Button(action: { showAddEvent = true }) {
                            Image(systemName: "plus.circle.fill")
                        }
                    }
                    .foregroundColor(selectedCategory.accentColor)
                }
            }
            .sheet(isPresented: $showAddEvent) {
                AddEventView(category: selectedCategory)
            }
            .sheet(item: $selectedEvent) { event in
                EventDetailView(event: event)
            }
        }
    }
}

// MARK: - Calendar Header

struct CalendarHeaderView: View {
    @ObservedObject var viewModel: EventViewModel

    var body: some View {
        HStack {
            Button(action: { viewModel.goToPrevious() }) {
                Image(systemName: "chevron.left")
                    .font(.title3)
            }

            Spacer()

            Text(viewModel.currentMonthName)
                .font(.title2)
                .fontWeight(.bold)

            Spacer()

            Button(action: { viewModel.goToNext() }) {
                Image(systemName: "chevron.right")
                    .font(.title3)
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }
}

// MARK: - View Mode Selector

struct ViewModeSelector: View {
    @ObservedObject var viewModel: EventViewModel
    let category: TaskCategory

    var body: some View {
        HStack(spacing: 0) {
            ForEach(EventViewModel.CalendarViewMode.allCases, id: \.self) { mode in
                Button(action: {
                    withAnimation(.spring(response: 0.3)) {
                        viewModel.viewMode = mode
                    }
                }) {
                    Text(mode.rawValue)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(viewModel.viewMode == mode ? category.accentColor : .clear)
                        .foregroundColor(viewModel.viewMode == mode ? .white : .primary)
                }
            }
        }
        .background(Color(.systemGray5))
        .cornerRadius(8)
        .padding(.horizontal)
        .padding(.bottom, 8)
    }
}

// MARK: - Day View

struct DayView: View {
    @EnvironmentObject var dataController: DataController
    @ObservedObject var viewModel: EventViewModel
    let category: TaskCategory
    @Binding var selectedEvent: CalendarEvent?

    var dayEvents: [CalendarEvent] {
        viewModel.filterEvents(
            dataController.eventsForDate(viewModel.selectedDate, category: category),
            for: category
        )
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Date header
                VStack(spacing: 4) {
                    Text(viewModel.dayName(for: viewModel.selectedDate))
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(viewModel.dayNumber(for: viewModel.selectedDate))
                        .font(.system(size: 40, weight: .bold))
                        .foregroundColor(viewModel.isToday(viewModel.selectedDate) ? category.accentColor : .primary)
                }
                .padding()

                Divider()

                if dayEvents.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "calendar")
                            .font(.system(size: 40))
                            .foregroundColor(.secondary)
                        Text("Geen afspraken")
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 60)
                } else {
                    // Timeline view
                    LazyVStack(spacing: 0) {
                        ForEach(viewModel.timeSlots(), id: \.self) { timeSlot in
                            TimeSlotRow(
                                timeSlot: timeSlot,
                                events: dayEvents.filter { event in
                                    let calendar = Calendar.current
                                    let eventHour = calendar.component(.hour, from: event.startDate)
                                    let slotHour = calendar.component(.hour, from: timeSlot)
                                    return eventHour == slotHour
                                },
                                category: category,
                                selectedEvent: $selectedEvent
                            )
                        }
                    }
                    .padding()
                }
            }
        }
    }
}

struct TimeSlotRow: View {
    let timeSlot: Date
    let events: [CalendarEvent]
    let category: TaskCategory
    @Binding var selectedEvent: CalendarEvent?

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Time label
            Text(formatHour(timeSlot))
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(width: 50, alignment: .trailing)

            // Events
            VStack(spacing: 4) {
                ForEach(events) { event in
                    EventCardCompact(event: event, category: category)
                        .onTapGesture { selectedEvent = event }
                }

                if events.isEmpty {
                    Rectangle()
                        .fill(Color(.systemGray6))
                        .frame(height: 1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(minHeight: 44)
    }

    func formatHour(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter.string(from: date)
    }
}

struct EventCardCompact: View {
    let event: CalendarEvent
    let category: TaskCategory

    var body: some View {
        HStack {
            RoundedRectangle(cornerRadius: 2)
                .fill(event.category.accentColor)
                .frame(width: 4)

            VStack(alignment: .leading, spacing: 2) {
                Text(event.title)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text(event.formattedTimeRange)
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
        .padding(8)
        .background(event.category.accentColor.opacity(0.1))
        .cornerRadius(8)
    }
}

// MARK: - Week View

struct WeekView: View {
    @EnvironmentObject var dataController: DataController
    @ObservedObject var viewModel: EventViewModel
    let category: TaskCategory
    @Binding var selectedEvent: CalendarEvent?

    var body: some View {
        VStack(spacing: 0) {
            // Week days header
            HStack(spacing: 0) {
                ForEach(viewModel.currentWeekDays, id: \.self) { date in
                    VStack(spacing: 4) {
                        Text(viewModel.dayName(for: date))
                            .font(.caption2)
                            .foregroundColor(.secondary)

                        Text(viewModel.dayNumber(for: date))
                            .font(.subheadline)
                            .fontWeight(viewModel.isToday(date) ? .bold : .regular)
                            .foregroundColor(viewModel.isToday(date) ? .white : .primary)
                            .frame(width: 32, height: 32)
                            .background(
                                Circle()
                                    .fill(viewModel.isToday(date) ? category.accentColor : Color.clear)
                            )
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(viewModel.isSelected(date) ? Color(.systemGray5) : Color.clear)
                    .onTapGesture {
                        viewModel.selectedDate = date
                    }
                }
            }
            .background(Color(.systemBackground))

            Divider()

            // Events for selected day
            ScrollView {
                let events = viewModel.filterEvents(
                    dataController.eventsForDate(viewModel.selectedDate, category: category),
                    for: category
                )

                if events.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "calendar")
                            .font(.system(size: 40))
                            .foregroundColor(.secondary)
                        Text("Geen afspraken op \(viewModel.dayNumber(for: viewModel.selectedDate)) \(viewModel.currentMonthName)")
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 60)
                } else {
                    LazyVStack(spacing: 8) {
                        ForEach(events) { event in
                            EventRowFull(event: event)
                                .onTapGesture { selectedEvent = event }
                        }
                    }
                    .padding()
                }
            }
        }
    }
}

struct EventRowFull: View {
    let event: CalendarEvent

    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 4)
                .fill(event.category.accentColor)
                .frame(width: 4)

            VStack(alignment: .leading, spacing: 4) {
                Text(event.title)
                    .font(.headline)

                HStack(spacing: 8) {
                    Label(event.formattedTimeRange, systemImage: "clock")

                    if let location = event.location {
                        Label(location, systemImage: "location")
                    }
                }
                .font(.caption)
                .foregroundColor(.secondary)
            }

            Spacer()

            if event.importSource != .manual {
                Image(systemName: event.importSource.icon)
                    .foregroundColor(event.importSource.color)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
    }
}

// MARK: - Month View

struct MonthView: View {
    @EnvironmentObject var dataController: DataController
    @ObservedObject var viewModel: EventViewModel
    let category: TaskCategory
    @Binding var selectedEvent: CalendarEvent?

    let columns = Array(repeating: GridItem(.flexible(), spacing: 0), count: 7)
    let weekDays = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"]

    var body: some View {
        VStack(spacing: 0) {
            // Week day headers
            HStack(spacing: 0) {
                ForEach(weekDays, id: \.self) { day in
                    Text(day)
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity)
                }
            }
            .padding(.vertical, 8)
            .background(Color(.systemBackground))

            Divider()

            // Calendar grid
            ScrollView {
                LazyVGrid(columns: columns, spacing: 0) {
                    // Add empty cells for days before the first of the month
                    let firstDay = viewModel.currentMonthDays.first ?? Date()
                    let weekday = Calendar.current.component(.weekday, from: firstDay)
                    let offset = (weekday + 5) % 7 // Adjust for Monday start

                    ForEach(0..<offset, id: \.self) { _ in
                        Color.clear
                            .frame(height: 80)
                    }

                    ForEach(viewModel.currentMonthDays, id: \.self) { date in
                        MonthDayCell(
                            date: date,
                            events: dataController.eventsForDate(date, category: category),
                            isToday: viewModel.isToday(date),
                            isSelected: viewModel.isSelected(date),
                            category: category
                        )
                        .onTapGesture {
                            viewModel.selectedDate = date
                            viewModel.viewMode = .day
                        }
                    }
                }
                .padding(.horizontal, 4)
            }
        }
    }
}

struct MonthDayCell: View {
    let date: Date
    let events: [CalendarEvent]
    let isToday: Bool
    let isSelected: Bool
    let category: TaskCategory

    var body: some View {
        VStack(spacing: 4) {
            Text("\(Calendar.current.component(.day, from: date))")
                .font(.subheadline)
                .fontWeight(isToday ? .bold : .regular)
                .foregroundColor(isToday ? .white : .primary)
                .frame(width: 28, height: 28)
                .background(
                    Circle()
                        .fill(isToday ? category.accentColor : Color.clear)
                )

            // Event dots
            HStack(spacing: 2) {
                ForEach(events.prefix(3)) { event in
                    Circle()
                        .fill(event.category.accentColor)
                        .frame(width: 6, height: 6)
                }
            }

            Spacer()
        }
        .frame(height: 80)
        .frame(maxWidth: .infinity)
        .background(isSelected ? Color(.systemGray6) : Color.clear)
        .border(Color(.systemGray5), width: 0.5)
    }
}

// MARK: - Event Detail View

struct EventDetailView: View {
    @EnvironmentObject var dataController: DataController
    @Environment(\.dismiss) private var dismiss
    @State var event: CalendarEvent
    @State private var isEditing = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    if isEditing {
                        TextField("Titel", text: $event.title)
                        TextField("Beschrijving", text: $event.description, axis: .vertical)
                            .lineLimit(3...6)
                    } else {
                        Text(event.title)
                            .font(.headline)
                        if !event.description.isEmpty {
                            Text(event.description)
                                .foregroundColor(.secondary)
                        }
                    }
                }

                Section("Tijd") {
                    if isEditing {
                        Toggle("Hele dag", isOn: $event.isAllDay)

                        if !event.isAllDay {
                            DatePicker("Start", selection: $event.startDate)
                            DatePicker("Einde", selection: $event.endDate)
                        } else {
                            DatePicker("Datum", selection: $event.startDate, displayedComponents: .date)
                        }
                    } else {
                        LabeledContent("Datum") {
                            Text(event.formattedDate)
                        }
                        LabeledContent("Tijd") {
                            Text(event.formattedTimeRange)
                        }
                    }
                }

                Section("Details") {
                    if isEditing {
                        Picker("Categorie", selection: $event.category) {
                            ForEach(TaskCategory.allCases, id: \.self) { category in
                                Label(category.rawValue, systemImage: category.icon)
                                    .tag(category)
                            }
                        }

                        TextField("Locatie", text: Binding(
                            get: { event.location ?? "" },
                            set: { event.location = $0.isEmpty ? nil : $0 }
                        ))
                    } else {
                        LabeledContent("Categorie") {
                            Label(event.category.rawValue, systemImage: event.category.icon)
                                .foregroundColor(event.category.accentColor)
                        }

                        if let location = event.location {
                            LabeledContent("Locatie") {
                                Text(location)
                            }
                        }
                    }
                }

                if event.importSource != .manual {
                    Section("Bron") {
                        LabeledContent("Geïmporteerd van") {
                            Label(event.importSource.rawValue, systemImage: event.importSource.icon)
                                .foregroundColor(event.importSource.color)
                        }
                    }
                }

                Section {
                    Button(role: .destructive, action: {
                        dataController.deleteEvent(event)
                        dismiss()
                    }) {
                        Label("Verwijder afspraak", systemImage: "trash")
                    }
                }
            }
            .navigationTitle("Afspraak details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Annuleer") { dismiss() }
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button(isEditing ? "Opslaan" : "Bewerk") {
                        if isEditing {
                            dataController.updateEvent(event)
                        }
                        isEditing.toggle()
                    }
                }
            }
        }
    }
}

#Preview {
    CalendarView(selectedCategory: .constant(.work))
        .environmentObject(DataController.shared)
}
