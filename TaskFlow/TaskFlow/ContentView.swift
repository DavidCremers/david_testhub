import SwiftUI

struct ContentView: View {
    @State private var selectedTab = 0
    @State private var selectedCategory: TaskCategory = .work

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView(selectedCategory: $selectedCategory)
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(0)

            TaskListView(selectedCategory: $selectedCategory)
                .tabItem {
                    Label("Taken", systemImage: "checklist")
                }
                .tag(1)

            CalendarView(selectedCategory: $selectedCategory)
                .tabItem {
                    Label("Agenda", systemImage: "calendar")
                }
                .tag(2)

            IntegrationsView()
                .tabItem {
                    Label("Integraties", systemImage: "link")
                }
                .tag(3)
        }
        .tint(selectedCategory == .work ? .blue : .purple)
    }
}

#Preview {
    ContentView()
        .environmentObject(DataController.shared)
}
