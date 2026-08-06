import { Pencil, Plus, RotateCcw, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createWorkType, getWorkTypes, updateWorkType, updateWorkTypeStatus } from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";

const emptyForm = { name: "", requiredPeople: 1, isRemaining: false, status: "active", color: "purple" };

function normalizeColor(color) {
  const legacyColors = {
    "#7C3AED": "purple",
    "#8B5CF6": "purple",
    "#22C55E": "green",
    "#F59E0B": "orange",
    "#6B7280": "gray",
  };
  return legacyColors[color] || color || "purple";
}

function WorkTypes() {
  const [workTypes, setWorkTypes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [statusTarget, setStatusTarget] = useState(null);

  useEffect(() => {
    async function load() {
      try { setWorkTypes(await getWorkTypes()); } catch (requestError) { setError(requestError.message); }
    }
    load();
  }, []);
  function open(item = null) {
    setEditing(item);
    setForm(item ? { ...item, color: normalizeColor(item.color) } : emptyForm);
    setError(""); setMessage(""); setIsOpen(true);
  }
  async function save(event) {
    event.preventDefault();
    if (!form.name.trim()) { setError("Enter a work type name."); return; }
    setIsSaving(true); setError("");
    try {
      const saved = editing ? await updateWorkType(editing.id, form) : await createWorkType(form);
      setWorkTypes((items) => editing ? items.map((item) => item.id === saved.id ? saved : item) : [...items, saved]);
      setMessage(`${saved.name} was ${editing ? "updated" : "added"}.`);
      setIsOpen(false);
    } catch (requestError) { setError(requestError.message); }
    finally { setIsSaving(false); }
  }
  async function toggle(item) {
    const status = item.status === "active" ? "inactive" : "active";
    setError(""); setMessage("");
    try {
      const saved = await updateWorkTypeStatus(item.id, status);
      setWorkTypes((items) => items.map((entry) => entry.id === saved.id ? saved : entry));
      setMessage(`${saved.name} is now ${status}.`);
      setStatusTarget(null);
    } catch (requestError) { setError(requestError.message); }
  }

  return <div className="page">
    <header className="page-header"><div><h1>Work Types</h1><p className="page-subtitle">Manage assignments used in rotations.</p></div>
      <button type="button" className="outline-button" onClick={() => open()}><Plus size={18}/>Add</button></header>
    {error && <div className="error-message" role="alert">{error}</div>}
    {message && <div className="success-message" role="status">{message}</div>}
    {workTypes.length === 0 ? <div className="empty-state"><Users size={34}/><h2>No work types</h2><p>Add a work type to configure rotation assignments.</p></div> :
      <div className="worktype-list">{workTypes.map((item) => <article className="worktype-card" key={item.id}>
        <div className="worktype-card__leading"><div className={`worktype-card__icon worktype-card__icon--${normalizeColor(item.color)}`}><Users size={20}/></div>
          <div><strong>{item.name}</strong><span className="worktype-meta">{item.requiredPeople} {item.requiredPeople === 1 ? "person" : "people"}{item.isRemaining ? " · remaining staff" : ""}</span></div></div>
        <div className="staff-card-actions"><button type="button" className="icon-button" onClick={() => open(item)} aria-label={`Edit ${item.name}`}><Pencil size={18}/></button>
          <button type="button" className={item.status === "active" ? "icon-button icon-button--danger" : "icon-button icon-button--restore"} onClick={() => setStatusTarget(item)} aria-label={`${item.status === "active" ? "Deactivate" : "Restore"} ${item.name}`}><RotateCcw size={18}/></button></div>
      </article>)}</div>}
    {isOpen && <div className="modal-backdrop"><section className="staff-modal" role="dialog" aria-modal="true" aria-labelledby="work-type-title">
      <header className="staff-modal__header"><div><h2 id="work-type-title">{editing ? "Edit Work Type" : "Add Work Type"}</h2><p>Configure how staff are assigned.</p></div><button type="button" className="icon-button" onClick={() => setIsOpen(false)} aria-label="Close"><X size={21}/></button></header>
      <form onSubmit={save}><div className="form-field"><label htmlFor="workName">Name</label><input id="workName" value={form.name} onChange={(e) => setForm({...form, name:e.target.value})}/></div>
        <div className="form-field"><label htmlFor="requiredPeople">Required people</label><input id="requiredPeople" type="number" min="1" step="1" value={form.requiredPeople} onChange={(e) => setForm({...form, requiredPeople:Number(e.target.value)})}/></div>
        <div className="form-field"><label htmlFor="workColor">Color</label><select id="workColor" value={form.color} onChange={(e) => setForm({...form, color:e.target.value})}><option value="purple">Purple</option><option value="green">Green</option><option value="orange">Orange</option><option value="gray">Gray</option></select></div>
        <label className="checkbox-field"><input type="checkbox" checked={form.isRemaining} onChange={(e) => setForm({...form, isRemaining:e.target.checked})}/><span>Assign all remaining staff</span></label>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setIsOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={isSaving}>{isSaving ? "Saving..." : editing ? "Save Changes" : "Add Work Type"}</button></div>
      </form></section></div>}
    <ConfirmDialog isOpen={Boolean(statusTarget)} title={statusTarget?.status === "active" ? "Deactivate work type?" : "Restore work type?"} message={statusTarget?.status === "active" ? `${statusTarget?.name} will be excluded from new schedules. Existing history will not change.` : `${statusTarget?.name} will be available in new schedules again.`} confirmLabel={statusTarget?.status === "active" ? "Deactivate" : "Restore"} tone={statusTarget?.status === "active" ? "danger" : "primary"} onCancel={() => setStatusTarget(null)} onConfirm={() => toggle(statusTarget)} />
  </div>;
}

export default WorkTypes;
