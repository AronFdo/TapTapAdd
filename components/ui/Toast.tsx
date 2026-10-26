import { StatusLight, type Status } from "./StatusLight";

type ToastProps = {
  /** Short and plain: "Published", "CV uploaded". */
  message: string;
  state?: Status;
};

export function Toast({ message, state = "live" }: ToastProps) {
  return (
    <div className="toast" role={state === "problem" ? "alert" : "status"}>
      <StatusLight state={state} label={message} />
    </div>
  );
}
