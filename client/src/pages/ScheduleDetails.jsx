import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ArrowRight, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getSchedule } from "../services/api";

function ScheduleDetails() {
  const { scheduleId } = useParams();
  const normalizedScheduleId = useMemo(() => scheduleId, [scheduleId]);
  const [schedule, setSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSchedule() {
      try {
        setSchedule(await getSchedule(normalizedScheduleId));
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadSchedule();
  }, [normalizedScheduleId]);

  if (isLoading) {
    return <div className="page"><p>Loading schedule...</p></div>;
  }

  if (!schedule) {
    return (
      <div className="page">
        <header className="page-header">
          <h1>Schedule not found</h1>
        </header>

        <p>{error || "The requested schedule could not be found."}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header schedule-header">
        <div>
          <h1>Week {schedule.weekNumber}</h1>
          <p className="page-subtitle">{schedule.dates}</p>
        </div>

        <span className="published-badge">Published</span>
      </header>

      <div className="schedule-meta">
        <strong>{schedule.department}</strong>
        <span>{schedule.dates}</span>
      </div>

      <div className="rotation-groups">
        {schedule.rotation.map((assignment) => (
          <article
            key={assignment.id}
            className="rotation-card rotation-card--gray"
          >
            <div className="rotation-card__header">
              <div className="rotation-card__title">
                <div className="rotation-card__icon">
                  <Users size={20} />
                </div>

                <strong>{assignment.name}</strong>
              </div>

              <span>{assignment.requiredPeople}</span>
            </div>

            <div className="assigned-staff-list">
              {assignment.staff.length === 0 ? (
                <div className="assigned-staff-card">
                  <span>No staff assigned yet.</span>
                </div>
              ) : (
                assignment.staff.map((person) => (
                  <div
                    key={person.id}
                    className="assigned-staff-card assigned-staff-card--details"
                  >
                    <span>{person.name}</span>
                    <ArrowRight size={18} />
                  </div>
                ))
              )}
            </div>
          </article>
        ))}
      </div>

      <button type="button" className="primary-button" style={{ marginTop: 10 }}>
        Edit Schedule
      </button>
    </div>
  );
}

export default ScheduleDetails;
