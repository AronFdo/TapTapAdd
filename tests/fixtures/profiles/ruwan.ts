import type { ProfileInput } from "@/lib/schemas/profile";

/**
 * A fictional sales lead with a sparse CV: no summary, projects or skills,
 * and no visible email. Checks that empty sections disappear cleanly.
 */
export const ruwanProfile = {
  name: "Ruwan Jayasuriya",
  headline: "Regional sales lead, FMCG",
  contact: {
    email: { value: "ruwan@example.com", visible: false },
    phone: { value: "+94 76 000 0000", visible: true },
  },
  links: [{ kind: "linkedin", url: "https://www.linkedin.com/in/ruwan-example", visible: true }],
  experience: [
    {
      role: "Regional sales lead",
      organisation: "Example Foods",
      location: "Galle",
      start: "2020",
      current: true,
      highlights: ["Grew Southern Province revenue 34% in two years", "Lead a team of 12 field representatives"],
    },
    { role: "Sales representative", organisation: "Example Beverages", start: "2015", end: "2019" },
  ],
} satisfies ProfileInput;
