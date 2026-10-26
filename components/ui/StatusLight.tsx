export type Status = "off" | "live" | "draft" | "problem";

type StatusLightProps = {
  state: Status;
  /** Always shown, so the state never depends on colour alone. */
  label: string;
  className?: string;
};

export function StatusLight({ state, label, className }: StatusLightProps) {
  return (
    <span className={className ? `status ${className}` : "status"} data-state={state}>
      <span className="status__light" aria-hidden />
      {label}
    </span>
  );
}
