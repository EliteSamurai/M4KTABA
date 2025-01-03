import NextAuth, { NextAuthOptions, User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { client } from "@/studio-m4ktaba/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { urlFor } from "@/utils/imageUrlBuilder";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials || {};

        if (!email || !password) {
          throw new Error("Missing email or password.");
        }

        const query = `*[_type == "user" && email == $email][0]`;
        const user = await client.fetch(query, { email });

        if (!user) {
          throw new Error("User not found.");
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          throw new Error("Invalid email or password.");
        }

        return {
          _id: user._id, // Use `_id` directly
          email: user.email,
          image: user.image ? urlFor(user.image) : "",
          location: user.location,
          stripeAccountId: user.stripeAccountId || null, // Include stripeAccountId
        } as User;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token._id = user._id; // Use `_id` directly
        token.email = user.email;
        token.location = user.location || {};
        token.stripeAccountId = user.stripeAccountId || null; // Add stripeAccountId

        if (account?.provider === "google") {
          try {
            let existingUser = await client.fetch(
              `*[_type == "user" && email == $email][0]`,
              { email: token.email }
            );

            if (!existingUser) {
              const newUser = {
                _type: "user",
                _id: user._id ?? uuidv4(), // Use `_id`
                email: user.email,
                location: user.location || {},
                image: user.image || null,
                stripeAccountId: user.stripeAccountId || null, // Save stripeAccountId
              };

              await client.createIfNotExists(newUser);
              existingUser = newUser;
            }

            token._id = existingUser._id; // Use `_id`
            token.image = existingUser.image
              ? urlFor(existingUser.image)
              : user.image || "";
            token.location = existingUser.location || {};
            token.stripeAccountId = existingUser.stripeAccountId || null; // Add stripeAccountId
          } catch (error) {
            console.error("Error fetching or creating Google user:", error);
          }
        } else {
          token._id = user._id; // Use `_id`
          token.image = user.image || "";
          token.location = user.location || {};
          token.stripeAccountId = user.stripeAccountId || null; // Add stripeAccountId
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user._id = token._id; // Use `_id`
      session.user.email = token.email;
      session.user.location = token.location;
      session.user.image = token.image || "";
      session.user.stripeAccountId = token.stripeAccountId || null; // Add stripeAccountId

      try {
        const latestUser = await client.fetch(
          `*[_type == "user" && _id == $_id][0]{email, image, location, stripeAccountId}`,
          { _id: token._id } // Use `_id`
        );

        session.user.image = latestUser?.image?.asset?._ref
          ? urlFor(latestUser.image)
          : session.user.image || "";
        session.user.location = latestUser?.location || session.user.location;
        session.user.stripeAccountId =
          latestUser?.stripeAccountId || session.user.stripeAccountId; // Update stripeAccountId
      } catch (error) {
        console.error("Error fetching user data for session:", error);
      }

      try {
        const userCart = await client.fetch(
          `*[_type == "user" && _id == $_id][0].cart`,
          { _id: token._id } // Use `_id`
        );
        session.user.cart = userCart || [];
      } catch (error) {
        console.error("Error fetching user cart:", error);
      }

      return session;
    },
  },

  pages: {
    signOut: "/", // Redirect to the root path on sign out
  },
};

export default NextAuth(authOptions);
