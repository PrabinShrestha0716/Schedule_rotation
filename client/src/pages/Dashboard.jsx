import {
  CalendarDays,
  GripVertical,
  RefreshCw,
  Save,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  formatDate,
  getISOWeekNumber,
  getWorkWeekDates,
} from "../utils/dateUtils";
import { migrateLocalScheduleHistory } from "../services/historyStorage";
import { createSchedule, getSchedules, getStaffMembers, getWorkTypes } from "../services/api";

function getInitials(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

function normalizeVariant(color) {
  const variants = {
    "#7C3AED": "purple", "#8B5CF6": "purple", "#22C55E": "green",
    "#F59E0B": "orange", "#6B7280": "gray",
  };
  return variants[color] || color || "purple";
}

function getPersonKey(person) {
  return person.id?.toString() || person.name.toLowerCase();
}

function getWorkTypeKey(workType) {
  return workType.name.trim().toLowerCase();
}

function buildAssignmentHistory(schedules) {
  const counts = new Map();
  const latestAssignments = new Set();

  schedules.forEach((schedule, scheduleIndex) => {
    schedule.rotation?.forEach((assignment) => {
      const workTypeKey = getWorkTypeKey(assignment);
      assignment.staff?.forEach((person) => {
        const assignmentKey = `${workTypeKey}:${getPersonKey(person)}`;
        counts.set(assignmentKey, (counts.get(assignmentKey) || 0) + 1);
        if (scheduleIndex === 0) latestAssignments.add(assignmentKey);
      });
    });
  });

  return { counts, latestAssignments };
}

function buildRotation(workTypes, staffMembers, schedules, weekNumber, generation) {
  const activeTypes = workTypes.filter((item) => item.status === "active");
  const activeStaff = staffMembers.filter((person) => person.status === "active");
  const offset = activeStaff.length ? ((weekNumber || 0) + generation) % activeStaff.length : 0;
  const orderedStaff = [...activeStaff.slice(offset), ...activeStaff.slice(0, offset)];
  const availableStaff = [...orderedStaff];
  const { counts, latestAssignments } = buildAssignmentHistory(schedules);

  return activeTypes.map((workType) => {
    const requested = workType.isRemaining
      ? availableStaff.length
      : Math.max(0, Number(workType.requiredPeople) || 0);
    const workTypeKey = getWorkTypeKey(workType);
    const rankedStaff = [...availableStaff].sort((first, second) => {
      const firstKey = `${workTypeKey}:${getPersonKey(first)}`;
      const secondKey = `${workTypeKey}:${getPersonKey(second)}`;
      const countDifference = (counts.get(firstKey) || 0) - (counts.get(secondKey) || 0);
      if (countDifference !== 0) return countDifference;

      const recentDifference = Number(latestAssignments.has(firstKey)) - Number(latestAssignments.has(secondKey));
      if (recentDifference !== 0) return recentDifference;
      return orderedStaff.indexOf(first) - orderedStaff.indexOf(second);
    });
    const assigned = rankedStaff.slice(0, requested);
    assigned.forEach((person) => availableStaff.splice(availableStaff.indexOf(person), 1));
    return {
      id: workType.id, name: workType.name,
      requiredPeople: workType.isRemaining ? assigned.length : requested,
      isRemaining: workType.isRemaining, variant: normalizeVariant(workType.color),
      staff: assigned.map((person) => ({ ...person, initials: getInitials(person.name) })),
    };
  });
}

function Dashboard() {
  const [department, setDepartment] = useState("RF");
  const [scheduleDate, setScheduleDate] = useState("");
  const [rotation, setRotation] = useState([]);
  const [message, setMessage] = useState("");
  const [staffMembers, setStaffMembers] = useState([]);
  const [workTypes, setWorkTypes] = useState([]);
  const [savedSchedules, setSavedSchedules] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    async function loadRotationData() {
      try {
        await migrateLocalScheduleHistory();
        const [staff, types, schedules] = await Promise.all([
          getStaffMembers(), getWorkTypes(), getSchedules(),
        ]);
        setStaffMembers(staff);
        setWorkTypes(types);
        setSavedSchedules(schedules);
      } catch (error) {
        setMessage(error.message);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadRotationData();
  }, []);

  const weekNumber = useMemo(
    () => getISOWeekNumber(scheduleDate),
    [scheduleDate]
  );

  const workWeek = useMemo(
    () => getWorkWeekDates(scheduleDate),
    [scheduleDate]
  );

  function handleGenerateRotation() {
    if (!department || !scheduleDate) {
      setMessage("Select a department and schedule date first.");
      return;
    }

    const activeStaffCount = staffMembers.filter((person) => person.status === "active").length;
    const activeWorkTypeCount = workTypes.filter((item) => item.status === "active").length;

    if (!activeStaffCount) {
      setMessage("Add at least one active staff member before generating a rotation.");
      return;
    }
    if (!activeWorkTypeCount) {
      setMessage("Add at least one active work type before generating a rotation.");
      return;
    }

    setRotation(buildRotation(workTypes, staffMembers, savedSchedules, weekNumber, generation));
    setGeneration((current) => current + 1);
    setMessage(`Fair rotation generated from saved assignment history for ${activeStaffCount} active staff.`);
  }

  function handleClear() {
    setRotation([]);
    setMessage("");
  }

  async function handleSave() {
    if (rotation.length === 0) {
      setMessage("Generate a rotation before saving.");
      return;
    }

    const schedule = {
      department,
      weekNumber,
      dates: workWeek
        ? `${formatDate(workWeek.friday)} – ${formatDate(workWeek.sunday)}`
        : "",
      rotation,
    };

    try {
      const savedSchedule = await createSchedule(schedule);
      setSavedSchedules((current) => [savedSchedule, ...current]);
      setMessage(`Week ${weekNumber} schedule saved successfully.`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="page dashboard-page">
      <header className="mobile-header">
        <div className="brand-mark">
          <RefreshCw size={24} />
        </div>

        <div>
          <h1>Staff Rotation Scheduler</h1>
        </div>
      </header>

      <section className="scheduler-section">
        <h2>Create Weekly Rotation</h2>

        <div className="form-field">
          <label htmlFor="department">Department</label>

          <select
            id="department"
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
          >
            <option value="RF">RF</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="scheduleDate">Schedule Date</label>

          <div className="date-input-wrapper">
            <CalendarDays size={19} />

            <input
              id="scheduleDate"
              type="date"
              value={scheduleDate}
              onChange={(event) => setScheduleDate(event.target.value)}
            />
          </div>
        </div>

        <div className="week-number-box">
          <span>Week Number</span>
          <strong>{weekNumber ? `Week ${weekNumber}` : "Select a date"}</strong>
        </div>

        {workWeek && (
          <div className="work-days-card">
            <CalendarDays size={20} />

            <div>
              <span>Work Days</span>
              <strong>Friday · Saturday · Sunday</strong>
              <p>
                {formatDate(workWeek.friday)} – {formatDate(workWeek.sunday)}
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          className="primary-button"
          onClick={handleGenerateRotation}
          disabled={isLoadingData}
        >
          <RefreshCw size={19} />
          {isLoadingData ? "Loading Staff and Work Types..." : "Generate Rotation"}
        </button>
      </section>

      {rotation.length > 0 && (
        <section className="generated-section">
          <div className="section-heading-row">
            <div>
              <h2>Generated Schedule</h2>
              <p>
                Week {weekNumber} · {formatDate(workWeek?.friday)} –{" "}
                {formatDate(workWeek?.sunday)}
              </p>
            </div>

            <span className="status-badge">Not Saved</span>
          </div>

          <div className="rotation-groups">
            {rotation.map((workType) => (
              <article
                key={workType.id}
                className={`rotation-card rotation-card--${workType.variant}`}
              >
                <div className="rotation-card__header">
                  <div className="rotation-card__title">
                    <div className="rotation-card__icon">
                      <Users size={20} />
                    </div>

                    <strong>{workType.name}</strong>
                  </div>

                  <span>{workType.requiredPeople}</span>
                </div>

                <div className="assigned-staff-list">
                  {workType.staff.map((staffMember) => (
                    <div
                      key={staffMember.id}
                      className="assigned-staff-card"
                      draggable
                    >
                      <GripVertical size={18} />

                      <div className="avatar">
                        {staffMember.initials}
                      </div>

                      <span>{staffMember.name}</span>
                    </div>
                  ))}
                  {workType.staff.length === 0 && (
                    <div className="assigned-staff-card assigned-staff-card--empty">
                      <span>No staff available for this work type.</span>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          <p className="drag-help">
            Drag and drop staff between work types to adjust assignments.
          </p>

          <button
            type="button"
            className="secondary-button"
            onClick={handleGenerateRotation}
          >
            <RefreshCw size={19} />
            Regenerate
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={handleSave}
          >
            <Save size={19} />
            Save Schedule
          </button>

          <button
            type="button"
            className="text-button text-button--danger"
            onClick={handleClear}
          >
            Clear Preview
          </button>
        </section>
      )}

      {message && (
        <div className="feedback-message" role="status">
          {message}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
