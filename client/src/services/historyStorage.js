import { createSchedule } from "./api";

const STORAGE_KEY = "schedule_history";

export function loadSavedSchedules() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const schedules = JSON.parse(storedValue);

    if (!Array.isArray(schedules)) {
      return [];
    }

    return schedules;
  } catch {
    return [];
  }
}

export function loadScheduleById(scheduleId) {
  return loadSavedSchedules().find(
    (schedule) => schedule.id.toString() === scheduleId.toString()
  );
}

export function saveSchedule(schedule) {
  const currentSchedules = loadSavedSchedules();
  const nextSchedules = [schedule, ...currentSchedules];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSchedules));
}

export function deleteSchedule(scheduleId) {
  const nextSchedules = loadSavedSchedules().filter(
    (schedule) => schedule.id.toString() !== scheduleId.toString()
  );
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSchedules));
}

export async function migrateLocalScheduleHistory() {
  const schedules = loadSavedSchedules();
  if (!schedules.length) return;

  await Promise.all(
    schedules.map((schedule) =>
      createSchedule({ ...schedule, legacyId: schedule.id })
    )
  );
  window.localStorage.removeItem(STORAGE_KEY);
}
