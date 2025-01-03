import "next-auth";
import { DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      _id: string;
      stripeAccountId: string;
      location?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
      };
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    _id?: string;
    email: string;
    image?: string;
    stripeAccountId: string;
    location?: {
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
    };
  }
}
