import Link from "next/link";
import type { ComponentProps, MouseEvent, ReactNode } from "react";

export type KeyVariant = "primary" | "secondary" | "accent" | "danger" | "quiet";
export type KeySize = "sm" | "md" | "lg";
export type KeyShape = "capsule" | "square" | "round";

type KeyStyleProps = {
  variant?: KeyVariant;
  /** sm is for desktop only; lg is for onboarding answers and the publish key. */
  size?: KeySize;
  shape?: KeyShape;
  /** A leading icon, 20px. Keys never have trailing arrows. */
  icon?: ReactNode;
};

// Round keys are icon-only, so they must carry an accessible name.
type Labelled =
  | { shape?: "capsule" | "square"; children: ReactNode }
  | { shape: "round"; "aria-label": string; children?: never };

function keyData({ variant = "primary", size = "md", shape = "capsule" }: KeyStyleProps) {
  return { "data-variant": variant, "data-size": size, "data-shape": shape };
}

function classes(extra?: string) {
  return extra ? `key ${extra}` : "key";
}

export type KeyProps = KeyStyleProps &
  Labelled &
  Omit<ComponentProps<"button">, "children"> & {
    /** Shows a pulsing status light and ignores clicks, keeping the key's width. */
    loading?: boolean;
    /** Makes the key a toggle: lit while pressed. */
    pressed?: boolean;
  };

export function Key({
  variant,
  size,
  shape,
  icon,
  loading = false,
  pressed,
  className,
  children,
  onClick,
  type = "button",
  ...rest
}: KeyProps) {
  const busy = loading ? <span className="key__busy" aria-hidden /> : null;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <button
      {...rest}
      type={type}
      className={classes(className)}
      {...keyData({ variant, size, shape })}
      aria-pressed={pressed}
      aria-busy={loading || undefined}
      onClick={handleClick}
    >
      {icon ? (
        <span className="key__icon" aria-hidden>
          {busy ?? icon}
        </span>
      ) : (
        busy
      )}
      {children}
    </button>
  );
}

export type KeyLinkProps = KeyStyleProps & Labelled & Omit<ComponentProps<typeof Link>, "children">;

/** A link that looks like a key, for navigation such as "Upload CV". */
export function KeyLink({ variant, size, shape, icon, className, children, ...rest }: KeyLinkProps) {
  return (
    <Link {...rest} className={classes(className)} {...keyData({ variant, size, shape })}>
      {icon ? (
        <span className="key__icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      {children}
    </Link>
  );
}
