import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { createCandidate } from "../services/candidateService";
import { departments, positions } from "../data/candidates";
import { useToast } from "../hooks/useToast";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  position: "",
  department: "",
  selectionDate: "",
  joiningDate: "",
  decision: "Selected",
};

export default function AddCandidate() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate() {
    const next = {};
    if (!form.firstName.trim()) next.firstName = "First name is required.";
    if (!form.lastName.trim()) next.lastName = "Last name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (!form.phone.trim()) next.phone = "Phone number is required.";
    if (!form.position) next.position = "Select a position.";
    if (!form.department) next.department = "Select a department.";
    if (!form.selectionDate) next.selectionDate = "Selection date is required.";
    if (!form.joiningDate) next.joiningDate = "Expected joining date is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    createCandidate({
      ...form,
      status: form.decision === "Selected" ? "SELECTED" : "REJECTED",
    }).then(() => {
      setSaving(false);
      showToast(`${form.firstName} ${form.lastName} was added as a candidate.`, "success");
      navigate("/candidates");
    }).catch((err) => {
      setSaving(false);
      showToast(err.message, "error");
    });
  }

  return (
    <div>
      <PageHeader title="Add Candidate" description="Enter the candidate's details to add them to the onboarding pipeline." />

      <form onSubmit={handleSubmit} noValidate>
        <div className="card" style={{ maxWidth: 780 }}>
          <div className="form-section">
            <div className="form-section-title">Candidate Information</div>
            <div className="form-section-desc">Basic contact details for the candidate.</div>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="firstName">First Name <span className="required">*</span></label>
                <input id="firstName" className={errors.firstName ? "has-error" : ""} value={form.firstName} onChange={(e) => update("firstName", e.target.value)} placeholder="e.g. Priya" />
                {errors.firstName && <span className="field-error">{errors.firstName}</span>}
              </div>
              <div className="form-field">
                <label htmlFor="lastName">Last Name <span className="required">*</span></label>
                <input id="lastName" className={errors.lastName ? "has-error" : ""} value={form.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="e.g. Sharma" />
                {errors.lastName && <span className="field-error">{errors.lastName}</span>}
              </div>
              <div className="form-field">
                <label htmlFor="email">Email <span className="required">*</span></label>
                <input id="email" type="email" className={errors.email ? "has-error" : ""} value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="name@company.com" />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>
              <div className="form-field">
                <label htmlFor="phone">Phone <span className="required">*</span></label>
                <input id="phone" className={errors.phone ? "has-error" : ""} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 98xxxxxxx" />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Job Information</div>
            <div className="form-section-desc">The role this candidate has been selected for.</div>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="position">Position <span className="required">*</span></label>
                <select id="position" className={errors.position ? "has-error" : ""} value={form.position} onChange={(e) => update("position", e.target.value)}>
                  <option value="">Select position</option>
                  {positions.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.position && <span className="field-error">{errors.position}</span>}
              </div>
              <div className="form-field">
                <label htmlFor="department">Department <span className="required">*</span></label>
                <select id="department" className={errors.department ? "has-error" : ""} value={form.department} onChange={(e) => update("department", e.target.value)}>
                  <option value="">Select department</option>
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.department && <span className="field-error">{errors.department}</span>}
              </div>
              <div className="form-field">
                <label htmlFor="selectionDate">Selection Date <span className="required">*</span></label>
                <input id="selectionDate" type="date" className={errors.selectionDate ? "has-error" : ""} value={form.selectionDate} onChange={(e) => update("selectionDate", e.target.value)} />
                {errors.selectionDate && <span className="field-error">{errors.selectionDate}</span>}
              </div>
              <div className="form-field">
                <label htmlFor="joiningDate">Expected Joining Date <span className="required">*</span></label>
                <input id="joiningDate" type="date" className={errors.joiningDate ? "has-error" : ""} value={form.joiningDate} onChange={(e) => update("joiningDate", e.target.value)} />
                {errors.joiningDate && <span className="field-error">{errors.joiningDate}</span>}
              </div>
            </div>
          </div>

          <div className="form-section" style={{ marginBottom: 0 }}>
            <div className="form-section-title">Status</div>
            <div className="form-section-desc">Was this candidate selected or rejected?</div>
            <div className="radio-group">
              <label className={`radio-option ${form.decision === "Selected" ? "checked" : ""}`}>
                <input type="radio" name="decision" checked={form.decision === "Selected"} onChange={() => update("decision", "Selected")} />
                Selected
              </label>
              <label className={`radio-option ${form.decision === "Rejected" ? "checked" : ""}`}>
                <input type="radio" name="decision" checked={form.decision === "Rejected"} onChange={() => update("decision", "Rejected")} />
                Rejected
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/candidates")}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save Candidate"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
