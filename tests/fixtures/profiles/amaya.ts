import type { ProfileInput } from "@/lib/schemas/profile";

/** A fictional data analyst early in her career, with a visible website link. */
export const amayaProfile = {
  name: "Amaya Fernando",
  headline: "Data analyst turning messy operations data into decisions",
  summary:
    "I help operations teams see what is actually happening, with dashboards people open every morning and analyses that end in a decision.",
  location: "Colombo, Sri Lanka",
  contact: {
    email: { value: "amaya@example.com", visible: true },
  },
  links: [
    { kind: "linkedin", url: "https://www.linkedin.com/in/amaya-example", visible: true },
    { kind: "website", url: "https://amaya.example.com", label: "Notebook", visible: true },
  ],
  experience: [
    {
      role: "Data analyst",
      organisation: "Example Retail",
      start: "2023-02",
      current: true,
      highlights: [
        "Built the store stock-out dashboard used in every regional manager's Monday meeting",
        "Found a forecasting gap that was overstocking 120 products, saving LKR 18 million a year",
      ],
    },
    { role: "Graduate analyst", organisation: "Example Insurance", start: "2022-01", end: "2023-01" },
  ],
  education: [{ institution: "University of Example", qualification: "BSc", field: "Statistics", end: "2021" }],
  skills: [
    { label: "Analysis", items: ["SQL", "Python", "pandas", "Forecasting"] },
    { label: "Tools", items: ["Power BI", "dbt", "Excel"] },
  ],
  projects: [
    {
      name: "Stock-out early warning",
      summary: "A daily model that flags stores likely to run out of fast movers within a week.",
      year: "2024",
      tags: ["Python", "Forecasting"],
    },
  ],
  certifications: [],
  languages: [{ name: "English" }, { name: "Sinhala" }, { name: "Tamil" }],
} satisfies ProfileInput;
