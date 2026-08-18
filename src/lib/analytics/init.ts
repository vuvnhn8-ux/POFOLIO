import { initStorage } from './storage';

let initialized = false;

export async function ensureInitialized(): Promise<void> {
  if (initialized) return;
  await initStorage();
  initialized = true;
}
