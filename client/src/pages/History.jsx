import { ChevronRight, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { migrateLocalScheduleHistory } from "../services/historyStorage";
import { deleteSavedSchedule, getSchedules } from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";

function History() {
  const [search, setSearch] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHistory() {
      try {
        await migrateLocalScheduleHistory();
        setSchedules(await getSchedules());
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, []);

  const filteredSchedules = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return schedules;
    return schedules.filter(
      (schedule) =>
        schedule.weekNumber.toString().includes(normalized) ||
        schedule.dates.toLowerCase().includes(normalized)
    );
  }, [search, schedules]);

  function requestDelete(event, schedule) {
    event.preventDefault();
    event.stopPropagation();
    setDeleteTarget(schedule);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const schedule = deleteTarget;
    try {
      await deleteSavedSchedule(schedule.id);
      setSchedules((current) => current.filter((item) => item.id !== schedule.id));
      setDeleteTarget(null);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page">
      <header className="page-header"><div><h1>History</h1><p className="page-subtitle">Browse past published rotations by week.</p></div></header>
      <div className="history-search staff-search">
        <Search size={18} />
        <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by week number or dates" aria-label="Search schedule history" />
      </div>
      {error && <div className="error-message" role="alert">{error}</div>}
      {isLoading ? (
        <div className="empty-state"><p>Loading schedule history...</p></div>
      ) : filteredSchedules.length === 0 ? (
        <div className="empty-state"><p>No saved schedules yet. Save a rotation to see it here.</p></div>
      ) : (
        <div className="history-list">
          {filteredSchedules.map((schedule) => (
            <Link key={schedule.id} to={`/history/${schedule.id}`} className="history-row">
              <div><strong>Week {schedule.weekNumber}</strong><span>{schedule.dates}</span></div>
              <div className="history-row__right">
                <span className="published-badge">Published</span>
                <button type="button" className="icon-button icon-button--danger history-delete-button" onClick={(event) => requestDelete(event, schedule)} aria-label={`Delete Week ${schedule.weekNumber} schedule`} title="Delete schedule"><Trash2 size={18} /></button>
                <ChevronRight size={19} />
              </div>
            </Link>
          ))}
        </div>
      )}
      <ConfirmDialog isOpen={Boolean(deleteTarget)} title="Delete saved schedule?" message={`Week ${deleteTarget?.weekNumber} will be permanently removed from history.`} confirmLabel="Delete Schedule" onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </div>
  );
}

export default History;
