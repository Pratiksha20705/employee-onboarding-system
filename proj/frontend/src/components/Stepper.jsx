import { Check } from "lucide-react";

// Vertical stepper — used on Candidate Details page.
export default function Stepper({ steps }) {
  return (
    <div className="stepper">
      {steps.map((step, i) => (
        <div key={i} className={`stepper-item ${step.state}`}>
          <div className="stepper-marker-col">
            <div className="stepper-marker">
              {step.state === "done" ? <Check /> : <span style={{ fontSize: 11, fontWeight: 700 }}>{i + 1}</span>}
            </div>
            {i < steps.length - 1 && <div className="stepper-line" />}
          </div>
          <div className="stepper-content">
            <div className="stepper-title">{step.title}</div>
            {step.meta && <div className="stepper-meta">{step.meta}</div>}
            {step.description && <div className="stepper-desc">{step.description}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
