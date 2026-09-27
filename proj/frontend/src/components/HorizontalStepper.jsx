import { Check } from "lucide-react";

// Horizontal stepper — used on Onboarding overview page.
export default function HorizontalStepper({ steps }) {
  return (
    <div className="stepper-h">
      {steps.map((step, i) => (
        <div key={i} className={`stepper-h-item ${step.state}`}>
          <div className="stepper-h-line" />
          <div className="stepper-h-marker">
            {step.state === "done" ? <Check /> : <span style={{ fontSize: 11, fontWeight: 700 }}>{i + 1}</span>}
          </div>
          <div className="stepper-h-label">{step.title}</div>
          <div className="stepper-h-status">{step.status}</div>
        </div>
      ))}
    </div>
  );
}
