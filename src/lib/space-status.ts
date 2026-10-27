import { Space, SpaceStatus } from "@prisma/client";

/**
 * Regla de Oro / Ciclo de vida dinámico sin cronjobs:
 * Si un espacio está marcado en base de datos como AVAILABLE pero su expiresAt ya pasó la fecha actual,
 * su estado computado en tiempo real es EXPIRED.
 */
export function resolveSpaceStatus<T extends Pick<Space, "status" | "expiresAt">>(
  space: T,
  now: Date = new Date()
): SpaceStatus {
  if (space.status === SpaceStatus.AVAILABLE && new Date(space.expiresAt) <= now) {
    return SpaceStatus.EXPIRED;
  }
  return space.status;
}

export function maskEmailOrName(name: string, email?: string): string {
  if (email && email.includes("@")) {
    const [user, domain] = email.split("@");
    if (user.length <= 2) return `${user[0]}***@${domain}`;
    return `${user[0]}***${user[user.length - 1]}@${domain}`;
  }
  const parts = name.trim().split(" ");
  if (parts.length > 1) {
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  }
  return name.length > 2 ? `${name.substring(0, 2)}***` : name;
}
