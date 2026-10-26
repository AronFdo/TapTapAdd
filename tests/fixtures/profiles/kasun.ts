import type { ProfileInput } from "@/lib/schemas/profile";

/** A fictional backend engineer with a project-heavy CV and grouped skills. */
export const kasunProfile = {
  name: "Kasun Wickramasinghe",
  headline: "Backend engineer building payment and logistics platforms",
  summary:
    "I build reliable backend systems that move money and parcels. I care about clear APIs, boring deployments and on-call rotations nobody dreads.\n\nOutside work I maintain a small open-source library for Sri Lankan address parsing.",
  location: "Kandy, Sri Lanka",
  photo: { value: "photos/kasun.jpg", visible: false },
  contact: {
    email: { value: "kasun@example.com", visible: true },
    phone: { value: "+94 71 000 0000", visible: true },
  },
  links: [
    { kind: "linkedin", url: "https://www.linkedin.com/in/kasun-example", visible: true },
    { kind: "github", url: "https://github.com/kasun-example", visible: true },
  ],
  experience: [
    {
      role: "Senior backend engineer",
      organisation: "Example Logistics",
      location: "Colombo",
      start: "2022-01",
      current: true,
      summary: "Lead engineer on the routing and dispatch platform used by 400 drivers.",
      highlights: [
        "Cut dispatch latency from 9 seconds to 600 milliseconds by moving routing to a queue",
        "Introduced contract tests between 14 services, halving failed deploys",
      ],
    },
    {
      role: "Software engineer",
      organisation: "Example Pay",
      location: "Colombo",
      start: "2019-06",
      end: "2021-12",
      highlights: ["Built the merchant settlement service, processing LKR 2 billion a month"],
    },
    { role: "Intern", organisation: "Example Labs", start: "2018-06", end: "2018-12" },
  ],
  education: [
    { institution: "University of Example", qualification: "BSc (Hons)", field: "Computer engineering", start: "2015", end: "2019" },
  ],
  skills: [
    { label: "Languages", items: ["Go", "TypeScript", "Python", "SQL"] },
    { label: "Infrastructure", items: ["PostgreSQL", "Kafka", "Kubernetes", "Terraform"] },
    { label: "Practices", items: ["Event-driven design", "Contract testing", "Incident response"] },
  ],
  projects: [
    {
      name: "lk-address",
      role: "Maintainer",
      summary: "An open-source parser that turns free-text Sri Lankan addresses into structured fields.",
      url: "https://github.com/kasun-example/lk-address",
      year: "2023",
      tags: ["Open source", "Go"],
    },
    {
      name: "Dispatch queue",
      role: "Lead engineer",
      summary: "Moved driver routing onto a Kafka-backed queue so dispatch keeps up with peak demand.",
      year: "2023",
      tags: ["Kafka", "Go", "Performance"],
    },
    {
      name: "Settlement service",
      summary: "Daily merchant payouts with full reconciliation and an audit trail finance actually trusts.",
      year: "2020",
      tags: ["Payments", "PostgreSQL"],
    },
  ],
  certifications: [{ name: "Certified Kubernetes Application Developer", issuer: "CNCF", year: "2022" }],
  languages: [
    { name: "Sinhala", level: "Native" },
    { name: "English", level: "Fluent" },
  ],
} satisfies ProfileInput;
