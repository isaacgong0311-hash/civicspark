import { Check } from "lucide-react";

const LABELS = ["Context", "Your take", "Evidence", "Perspectives", "Check", "Your voice", "Complete"];

export default function MissionProgress({ current }: { current: number }) {
  return (
    <nav className="mission-progress" aria-label="Mission chapters">
      {LABELS.map((label, index) => (
        <div className={`mission-progress-item ${index === current ? "is-current" : ""} ${index < current ? "is-done" : ""}`} key={label}>
          <span className="mission-progress-dot" aria-hidden="true">{index < current ? <Check size={12} /> : index + 1}</span>
          <span>{label}</span>
        </div>
      ))}
    </nav>
  );
}
