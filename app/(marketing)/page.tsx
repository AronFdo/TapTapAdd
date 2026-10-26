import { Panel } from "@/components/ui";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-8 px-4 py-16">
      <h1 className="text-center font-display text-display-l md:text-display-xl">TapTapAdd</h1>
      <Panel hero>
        <p className="max-w-[68ch]">
          Turn your CV into a portfolio site, linked to a card you tap. TapTapAdd is in a private pilot.
        </p>
      </Panel>
    </main>
  );
}
