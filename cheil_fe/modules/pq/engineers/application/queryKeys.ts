export const engineerPersonalInfoQueryKeys = {
  all: ["pq-engineers"] as const,
  profiles: (filters: Record<string, unknown>) => ["pq-engineers", "profiles", filters] as const,
  profile: (engineerId: string) => ["pq-engineers", "profile", engineerId || "none"] as const,
  certifications: ["references", "certifications"] as const,
};
