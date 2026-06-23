import type { Session, User } from '$lib/server/auth';

// See https://svelte.dev/docs/kit/types#app
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      user: User | null;
      session: Session | null;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
