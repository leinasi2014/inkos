import { v7 as uuidv7 } from "uuid";

export function createId(prefix: string): string {
  return `${prefix}_${uuidv7().replace(/-/g, "")}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function weakEtag(revision: number): string {
  return `W/"${revision}"`;
}
