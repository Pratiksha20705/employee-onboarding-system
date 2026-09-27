import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Check, Copy } from "lucide-react";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import FilterDropdown from "../components/FilterDropdown";
import CandidateTable from "../components/CandidateTable";
import ConfirmDialog from "../components/ConfirmDialog";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import { fetchCandidates, deleteCandidate, createCandidateAccount } from "../services/candidateService";
import { departments } from "../data/candidates";
import { useToast } from "../hooks/useToast";

const STATUS_OPTIONS = ["SELECTED", "ONBOARDING", "JOINED", "COMPLETED", "REJECTED"];

export default function Candidates() {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");
  const [sortBy, setSortBy] = useState("selectionDate");
  const [toDelete, setToDelete] = useState(null);
  const [accountCandidate, setAccountCandidate] = useState(null);
  const [accountResult, setAccountResult] = useState(null);
  const [accountBusy, setAccountBusy] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchCandidates().then((data) => {
      setCandidates(data);
      setLoading(false);
    }).catch((err) => { showToast(err.message, "error"); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    let list = candidates.filter((c) => {
      const matchesSearch =
        !search ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !status || c.status === status;
      const matchesDept = !department || c.department === department;
      return matchesSearch && matchesStatus && matchesDept;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === "name") return `${a.firstName}`.localeCompare(b.firstName);
      return new Date(b[sortBy] || 0) - new Date(a[sortBy] || 0);
    });
    return list;
  }, [candidates, search, status, department, sortBy]);

  function handleDelete() {
    deleteCandidate(toDelete.id).then(() => {
      setCandidates((prev) => prev.filter((c) => c.id !== toDelete.id));
      showToast(`${toDelete.firstName} ${toDelete.lastName} was removed.`, "success");
      setToDelete(null);
    }).catch((err) => showToast(err.message, "error"));
  }

  function openCreatePortalAccess(candidate) {
    setAccountResult(null);
    setAccountCandidate(candidate);
  }

  async function handleCreatePortalAccess() {
    setAccountBusy(true);
    try {
      const result = await createCandidateAccount(accountCandidate.id);
      setAccountResult(result);
      // Reflect the new login immediately so the row's action menu updates
      // to "Portal Access Created" without waiting on a full refetch.
      setCandidates((prev) =>
        prev.map((c) => (c.id === accountCandidate.id ? { ...c, hasLoginAccount: true } : c))
      );
      showToast("Candidate portal access created successfully.", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setAccountBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Candidates"
        description="Manage selected candidates and start their onboarding process."
        actions={
          <Link to="/candidates/new" className="btn btn-primary">
            <Plus size={16} /> Add Candidate
          </Link>
        }
      />

      <div className="toolbar">
        <SearchBar value={search} onChange={setSearch} placeholder="Search candidates…" />
        <FilterDropdown label="All statuses" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        <FilterDropdown label="All departments" value={department} onChange={setDepartment} options={departments} />
        <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort by">
          <option value="selectionDate">Sort: Selection date</option>
          <option value="joiningDate">Sort: Joining date</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      <div className="card card-flush">
        {loading ? (
          <LoadingSpinner label="Loading candidates…" />
        ) : (
          <CandidateTable candidates={filtered} onDelete={setToDelete} onCreatePortalAccess={openCreatePortalAccess} />
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Remove candidate"
        message={toDelete ? `This will permanently remove ${toDelete.firstName} ${toDelete.lastName} from the candidate list. This action cannot be undone.` : ""}
        confirmLabel="Remove"
        danger
      />

      <Modal
        open={!!accountCandidate}
        onClose={() => setAccountCandidate(null)}
        title="Create Candidate Portal Access"
        footer={
          accountResult ? (
            <button className="btn btn-primary" onClick={() => setAccountCandidate(null)}>Done</button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => setAccountCandidate(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={accountBusy} onClick={handleCreatePortalAccess}>
                {accountBusy ? "Creating…" : "Create Portal Access"}
              </button>
            </>
          )
        }
      >
        {accountCandidate && (
          accountResult ? (
            <div className="stack" style={{ gap: 12 }}>
              <div className="alert alert-success">
                <Check size={16} />
                <div>Candidate portal access created successfully. Share these credentials with the candidate securely — this password won't be shown again.</div>
              </div>
              <div className="form-field">
                <label>Candidate</label>
                <input value={`${accountCandidate.firstName} ${accountCandidate.lastName}`} disabled />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input value={accountResult.email} disabled />
              </div>
              <div className="form-field">
                <label>Temporary Password</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={accountResult.temporaryPassword} disabled style={{ fontFamily: "monospace" }} />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigator.clipboard?.writeText(accountResult.temporaryPassword)}
                  >
                    <Copy size={13} /> Copy
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="cell-sub">
              This creates a CANDIDATE portal login for{" "}
              <strong>{accountCandidate.firstName} {accountCandidate.lastName}</strong> (
              {accountCandidate.email}) so they can log in and complete their onboarding.
              A temporary password will be generated for you to share with them.
            </p>
          )
        )}
      </Modal>
    </div>
  );
}
