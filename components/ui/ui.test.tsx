// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Key, StatusLight, TextField, Toast } from ".";

afterEach(cleanup);

describe("Key", () => {
  it("is a button that defaults to the primary capsule", () => {
    render(<Key>Upload CV</Key>);
    const key = screen.getByRole("button", { name: "Upload CV" });
    expect(key).toHaveAttribute("type", "button");
    expect(key).toHaveAttribute("data-variant", "primary");
    expect(key).toHaveAttribute("data-shape", "capsule");
  });

  it("exposes toggle state for lit keys", () => {
    render(<Key pressed>Minimal</Key>);
    expect(screen.getByRole("button", { name: "Minimal" })).toHaveAttribute("aria-pressed", "true");
  });

  it("ignores clicks and reports busy while loading", () => {
    const onClick = vi.fn();
    render(
      <Key loading onClick={onClick}>
        Publish site
      </Key>,
    );
    const key = screen.getByRole("button", { name: "Publish site" });
    fireEvent.click(key);
    expect(onClick).not.toHaveBeenCalled();
    expect(key).toHaveAttribute("aria-busy", "true");
  });

  it("names round icon-only keys", () => {
    render(<Key shape="round" aria-label="Close" icon={<svg />} />);
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });
});

describe("StatusLight", () => {
  it("always shows its label as text", () => {
    render(<StatusLight state="live" label="Live" />);
    expect(screen.getByText("Live")).toBeVisible();
  });
});

describe("TextField", () => {
  it("links the label, hint and error to the input", () => {
    render(
      <TextField
        label="Email"
        hint="We send a sign-in link here."
        error="That email address is missing an @. Check it and try again."
      />,
    );
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      "We send a sign-in link here. That email address is missing an @. Check it and try again.",
    );
  });
});

describe("Toast", () => {
  it("announces success politely and problems assertively", () => {
    const { rerender } = render(<Toast message="Published" />);
    expect(screen.getByRole("status")).toHaveTextContent("Published");
    rerender(<Toast message="Couldn't publish" state="problem" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't publish");
  });
});
