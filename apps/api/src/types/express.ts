import type { UserProfile } from "@school-bus/shared";

declare global {
  namespace Express {
    interface Request {
      currentUser?: UserProfile;
    }
  }
}

export {};
