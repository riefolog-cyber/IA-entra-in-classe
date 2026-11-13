import {
  Accessibility,
  Building2,
  Compass,
  FileText,
  FlaskConical,
  MessageSquare,
  Scale,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

/**
 * Emblema della tappa: numero e simbolo propri, così ogni pagina ha
 * un'identità visiva invece di ripetere l'illustrazione della fase.
 */
const icons = [
  Compass,
  Search,
  Scale,
  FileText,
  ShieldCheck,
  MessageSquare,
  Users,
  Accessibility,
  FlaskConical,
  Building2,
];

export function StepEmblem({ index }: { index: number }) {
  const Icon = icons[index] ?? Compass;

  return (
    <div className="step-emblem" aria-hidden="true">
      <span className="step-emblem-number">{String(index + 1).padStart(2, "0")}</span>
      <Icon size={34} strokeWidth={1.5} />
      <span className="step-emblem-line" />
    </div>
  );
}
