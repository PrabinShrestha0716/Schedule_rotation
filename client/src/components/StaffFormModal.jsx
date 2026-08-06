import { X } from "lucide-react";
import { useState } from "react";

const emptyForm = {
  name: "",
  department: "RF",
  status: "active",
};

function StaffFormModal({
  isOpen,
  staffMember,
  onClose,
  onSubmit,
  isSaving,
}) {
  const [form, setForm] = useState(() => staffMember ? {
    name: staffMember.name || "",
    department: staffMember.department || "RF",
    status: staffMember.status || "active",
  } : emptyForm);
  const [error, setError] = useState("");

  if (!isOpen) {
    return null;
  }

  function updateField(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Enter the staff member's name.");
      return;
    }

    setError("");

    await onSubmit({
      name: form.name.trim(),
      department: form.department,
      status: form.status,
    });
  }

  return (
    <div className="modal-backdrop">
      <section
        className="staff-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-modal-title"
      >
        <header className="staff-modal__header">
          <div>
            <h2 id="staff-modal-title">
              {staffMember ? "Edit Staff Member" : "Add Staff Member"}
            </h2>

            <p>
              {staffMember
                ? "Update this staff member's details."
                : "Add a new member to the rotation."}
            </p>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close"
            disabled={isSaving}
          >
            <X size={21} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="staffName">Staff Name</label>
            <input
              id="staffName"
              name="name"
              type="text"
              value={form.name}
              onChange={updateField}
              placeholder="Example: John Smith"
              autoComplete="off"
            />
          </div>

          <div className="form-field">
            <label htmlFor="staffDepartment">Department</label>
            <select
              id="staffDepartment"
              name="department"
              value={form.department}
              onChange={updateField}
            >
              <option value="RF">RF</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="staffStatus">Status</label>
            <select
              id="staffStatus"
              name="status"
              value={form.status}
              onChange={updateField}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={isSaving}
            >
              {isSaving
                ? "Saving..."
                : staffMember
                  ? "Save Changes"
                  : "Add Staff"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default StaffFormModal;
