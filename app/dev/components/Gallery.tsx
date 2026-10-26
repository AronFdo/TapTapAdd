"use client";

import { Check, Moon, Rocket, Sparkles, Sun, Trash2, Upload, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Key, Panel, StatusLight, TextField, Toast, type KeyVariant } from "@/components/ui";

type Theme = "system" | "light" | "dark";

const variants: { variant: KeyVariant; label: string; icon?: ReactNode }[] = [
  { variant: "primary", label: "Upload CV", icon: <Upload size={20} /> },
  { variant: "secondary", label: "Save draft" },
  { variant: "accent", label: "Surprise me", icon: <Sparkles size={20} /> },
  { variant: "danger", label: "Delete account", icon: <Trash2 size={20} /> },
  { variant: "quiet", label: "Skip for now" },
];

const vibes = ["Orbit", "Minimal", "Editorial", "Technical"];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Panel title={title}>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </Panel>
  );
}

export function Gallery({ children }: { children?: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [vibe, setVibe] = useState("Orbit");
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  function publish() {
    setPublishing(true);
    setTimeout(() => setPublishing(false), 2000);
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-display-l">Component gallery</h1>
        <div className="flex gap-3" role="group" aria-label="Theme">
          {(["system", "light", "dark"] as const).map((option) => (
            <Key
              key={option}
              variant="secondary"
              shape="square"
              size="sm"
              pressed={theme === option}
              onClick={() => setTheme(option)}
              icon={option === "light" ? <Sun size={20} /> : option === "dark" ? <Moon size={20} /> : undefined}
            >
              {option === "system" ? "System" : option === "light" ? "Light" : "Dark"}
            </Key>
          ))}
        </div>
      </header>

      <Section title="Backlit keys">
        {variants.map(({ variant, label, icon }) => (
          <Key key={variant} variant={variant} icon={icon}>
            {label}
          </Key>
        ))}
      </Section>

      <Section title="Sizes">
        <Key size="sm">Small key</Key>
        <Key>Medium key</Key>
        <Key size="lg" icon={<Rocket size={20} />}>
          Publish site
        </Key>
        <Key shape="round" aria-label="Close" variant="secondary" icon={<X size={20} />} />
      </Section>

      <Section title="States">
        <Key disabled>Publish site</Key>
        <Key loading={publishing} onClick={publish} icon={<Rocket size={20} />}>
          Publish site
        </Key>
        <Key loading>Upload CV</Key>
      </Section>

      <Section title="Segmented keys">
        <div className="flex flex-wrap gap-3" role="group" aria-label="Vibe">
          {vibes.map((name) => (
            <Key
              key={name}
              variant="secondary"
              shape="square"
              pressed={vibe === name}
              onClick={() => setVibe(name)}
              icon={vibe === name ? <Check size={20} /> : undefined}
            >
              {name}
            </Key>
          ))}
        </div>
      </Section>

      <Section title="Status lights">
        <StatusLight state="live" label="Live" />
        <StatusLight state="draft" label="Draft" />
        <StatusLight state="off" label="Not published" />
        <StatusLight state="problem" label="Card isn't active" />
      </Section>

      <Panel title="Inputs">
        <div className="grid max-w-md gap-6">
          <TextField label="Full name" placeholder="Jane Perera" />
          <TextField label="Email" type="email" hint="We send a sign-in link here." />
          <TextField
            label="Site address"
            defaultValue="jane perera"
            error="Site addresses can't contain spaces. Use a hyphen instead."
          />
        </div>
      </Panel>

      <Section title="Toasts">
        <Toast message="Published" />
        <Toast message="CV uploaded" />
        <Toast message="Some sections couldn't be read" state="problem" />
      </Section>

      <Panel hero title="Hero panel">
        <p className="max-w-[68ch] text-muted">
          Hero panels get a single cut corner on the top right where the browser supports it, and a
          rounded corner elsewhere.
        </p>
      </Panel>

      {children}
    </main>
  );
}
