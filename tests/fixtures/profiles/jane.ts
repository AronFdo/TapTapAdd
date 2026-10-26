import type { ProfileInput } from "@/lib/schemas/profile";

/** A fictional profile with every section filled and every hidden field set. */
export const janeProfile = {
  name: "Jane Perera",
  headline: "Product designer for fintech and health apps",
  summary: "I design calm, accessible products for people who are short on time.",
  location: "Colombo, Sri Lanka",
  photo: { value: "photos/jane.jpg", visible: false },
  contact: {
    email: { value: "jane@example.com", visible: true },
    phone: { value: "+94 77 000 0000", visible: false },
    address: { value: "1 Example Lane, Colombo 03", visible: false },
    dateOfBirth: { value: "1994-05-12", visible: false },
  },
  links: [
    { kind: "linkedin", url: "https://www.linkedin.com/in/jane-example", visible: true },
    { kind: "website", url: "https://jane.example.com", visible: false },
  ],
  experience: [
    {
      role: "Senior product designer",
      organisation: "Example Pay",
      start: "2021-03",
      current: true,
      highlights: ["Redesigned onboarding, lifting completion from 54% to 81%"],
    },
    { role: "Product designer", organisation: "Example Health", start: "2018", end: "2021-02" },
  ],
  education: [{ institution: "University of Example", qualification: "BSc", field: "Computer science", end: "2017" }],
  skills: [{ label: "Design", items: ["Figma", "Prototyping", "Design systems"] }],
  projects: [{ name: "Example Pay app", summary: "A payments app for small shops.", year: "2023", tags: ["Mobile"] }],
  certifications: [{ name: "Google UX Design Certificate", issuer: "Google", year: "2020" }],
  languages: [{ name: "English", level: "Fluent" }, { name: "Sinhala", level: "Native" }],
} satisfies ProfileInput;
