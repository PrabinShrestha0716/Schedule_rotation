import {
  Pencil,
  Plus,
  RotateCcw,
  Search,
  UserRoundX,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import StaffFormModal from "../components/StaffFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  createStaffMember,
  getStaffMembers,
  updateStaffMember,
  updateStaffStatus,
} from "../services/api";

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function StaffMembers() {
  const [staffMembers, setStaffMembers] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);

  useEffect(() => {
    async function loadStaffMembers() {
      setIsLoading(true);
      setError("");

      try {
        const data = await getStaffMembers();
        setStaffMembers(data);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadStaffMembers();
  }, []);

  const activeCount = useMemo(
    () =>
      staffMembers.filter((staffMember) => staffMember.status === "active")
        .length,
    [staffMembers]
  );

  const inactiveCount = useMemo(
    () =>
      staffMembers.filter((staffMember) => staffMember.status === "inactive")
        .length,
    [staffMembers]
  );

  const filteredStaff = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return staffMembers.filter((staffMember) => {
      if (staffMember.status !== activeTab) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return staffMember.name.toLowerCase().includes(normalizedSearch);
    });
  }, [staffMembers, activeTab, search]);

  function openAddModal() {
    setEditingStaff(null);
    setIsModalOpen(true);
    setError("");
    setMessage("");
  }

  function openEditModal(staffMember) {
    setEditingStaff(staffMember);
    setIsModalOpen(true);
    setError("");
    setMessage("");
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingStaff(null);
  }

  async function handleSaveStaff(staffData) {
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      if (editingStaff) {
        const updatedStaff = await updateStaffMember(
          editingStaff.id,
          staffData
        );

        setStaffMembers((currentStaff) =>
          currentStaff.map((staffMember) =>
            staffMember.id === updatedStaff.id
              ? updatedStaff
              : staffMember
          )
        );

        setMessage(`${updatedStaff.name} was updated.`);
      } else {
        const newStaff = await createStaffMember(staffData);

        setStaffMembers((currentStaff) => [
          ...currentStaff,
          newStaff,
        ]);

        setActiveTab(newStaff.status);
        setMessage(`${newStaff.name} was added.`);
      }

      setIsModalOpen(false);
      setEditingStaff(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(staffMember) {
    const nextStatus =
      staffMember.status === "active" ? "inactive" : "active";

    setError("");
    setMessage("");

    try {
      const updatedStaff = await updateStaffStatus(
        staffMember.id,
        nextStatus
      );

      setStaffMembers((currentStaff) =>
        currentStaff.map((member) =>
          member.id === updatedStaff.id ? updatedStaff : member
        )
      );

      setMessage(
        nextStatus === "inactive"
          ? `${updatedStaff.name} is now inactive. Their history remains saved.`
          : `${updatedStaff.name} was restored to the active rotation.`
      );
      setStatusTarget(null);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page staff-page">
      <header className="page-header">
        <div>
          <h1>Staff Members</h1>
          <p className="page-subtitle">
            Manage the people included in weekly rotations.
          </p>
        </div>

        <button
          type="button"
          className="outline-button add-staff-button"
          onClick={openAddModal}
        >
          <Plus size={18} />
          Add Staff
        </button>
      </header>

      <div className="staff-search">
        <Search size={19} />

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search staff..."
          aria-label="Search staff members"
        />
      </div>

      <div className="staff-tabs">
        <button
          type="button"
          className={activeTab === "active" ? "staff-tab active" : "staff-tab"}
          onClick={() => setActiveTab("active")}
        >
          Active ({activeCount})
        </button>

        <button
          type="button"
          className={
            activeTab === "inactive" ? "staff-tab active" : "staff-tab"
          }
          onClick={() => setActiveTab("inactive")}
        >
          Inactive ({inactiveCount})
        </button>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="success-message" role="status">
          {message}
        </div>
      )}

      {isLoading ? (
        <div className="empty-state">
          <p>Loading staff members...</p>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="empty-state">
          <Users size={34} />

          <h2>
            {search
              ? "No matching staff members"
              : activeTab === "active"
                ? "No active staff members"
                : "No inactive staff members"}
          </h2>

          <p>
            {activeTab === "active"
              ? "Add a staff member to begin building the rotation."
              : "Staff members made inactive will appear here."}
          </p>
        </div>
      ) : (
        <div className="staff-list">
          {filteredStaff.map((staffMember) => (
            <article className="staff-list-card" key={staffMember.id}>
              <div className="staff-avatar">
                {getInitials(staffMember.name)}
              </div>

              <div className="staff-list-card__content">
                <strong>{staffMember.name}</strong>

                <div
                  className={`staff-status staff-status--${staffMember.status}`}
                >
                  <span />
                  {staffMember.status === "active"
                    ? "Active"
                    : "Inactive"}
                </div>
              </div>

              <div className="staff-card-actions">
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => openEditModal(staffMember)}
                  aria-label={`Edit ${staffMember.name}`}
                >
                  <Pencil size={18} />
                </button>

                <button
                  type="button"
                  className={
                    staffMember.status === "active"
                      ? "icon-button icon-button--danger"
                      : "icon-button icon-button--restore"
                  }
                  onClick={() => setStatusTarget(staffMember)}
                  aria-label={
                    staffMember.status === "active"
                      ? `Make ${staffMember.name} inactive`
                      : `Restore ${staffMember.name}`
                  }
                >
                  {staffMember.status === "active" ? (
                    <UserRoundX size={18} />
                  ) : (
                    <RotateCcw size={18} />
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {activeTab === "inactive" && inactiveCount > 0 && (
        <div className="inactive-information">
          Inactive staff are excluded from new rotations, but their previous
          schedule history remains available.
        </div>
      )}

      {isModalOpen && <StaffFormModal
        isOpen={isModalOpen}
        staffMember={editingStaff}
        onClose={closeModal}
        onSubmit={handleSaveStaff}
        isSaving={isSaving}
      />}
      <ConfirmDialog
        isOpen={Boolean(statusTarget)}
        title={statusTarget?.status === "active" ? "Make staff inactive?" : "Restore staff member?"}
        message={statusTarget?.status === "active" ? `${statusTarget?.name} will be excluded from new rotations. Saved history will remain unchanged.` : `${statusTarget?.name} will be included in new rotations again.`}
        confirmLabel={statusTarget?.status === "active" ? "Make Inactive" : "Restore"}
        tone={statusTarget?.status === "active" ? "danger" : "primary"}
        onCancel={() => setStatusTarget(null)}
        onConfirm={() => handleStatusChange(statusTarget)}
      />
    </div>
  );
}

export default StaffMembers;
