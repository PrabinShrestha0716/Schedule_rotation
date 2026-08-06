import { Navigate, Route, Routes } from "react-router-dom";

import BottomNavigation from "./components/BottomNavigation";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import ScheduleDetails from "./pages/ScheduleDetails";
import StaffMembers from "./pages/StaffMembers";
import WorkTypes from "./pages/WorkTypes";

function App() {
  return (
    <div className="app-shell">
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/staff" element={<StaffMembers />} />
          <Route path="/work-types" element={<WorkTypes />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:scheduleId" element={<ScheduleDetails />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <BottomNavigation />
    </div>
  );
}

export default App;