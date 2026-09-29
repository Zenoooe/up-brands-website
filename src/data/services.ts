export interface ServiceDefinition {
  slug: string;
  /** Order used for the numbered label and accent styling. */
  order: number;
}

// Real pages kept so legacy /service/* URLs from the old site resolve with content
// instead of a 404.
export const SERVICES: ServiceDefinition[] = [
  { slug: 'signage-system', order: 1 },
  { slug: 'branding-upgrade', order: 2 },
  { slug: 'ip-design', order: 3 },
  { slug: 'strategy-consulting', order: 4 },
];

export const SERVICE_SLUGS = SERVICES.map((service) => service.slug);

export function isServiceSlug(slug?: string): slug is string {
  return !!slug && SERVICE_SLUGS.includes(slug);
}

export function getRelatedServices(slug: string): ServiceDefinition[] {
  return SERVICES.filter((service) => service.slug !== slug);
}
