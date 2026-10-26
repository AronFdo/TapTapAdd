import type { ComponentProps, ReactNode } from "react";

type PanelProps = Omit<ComponentProps<"section">, "title"> & {
  title?: ReactNode;
  /** Hero panels get the single cut corner. Use on one panel per screen at most. */
  hero?: boolean;
};

export function Panel({ title, hero = false, className, children, ...rest }: PanelProps) {
  return (
    <section {...rest} className={className ? `panel ${className}` : "panel"} data-hero={hero || undefined}>
      {title ? <h2 className="mb-4 text-title font-semibold">{title}</h2> : null}
      {children}
    </section>
  );
}
