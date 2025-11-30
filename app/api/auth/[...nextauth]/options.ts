import NextAuth, { NextAuthOptions, User } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
        },
      },
    }),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const { email, password } = credentials || {};

        if (!email || !password) {
          throw new Error('Missing email or password.');
        }

        // Dynamic import of Sanity client
        const { writeClient } = await import('@/studio-m4ktaba/client');

        // Fetch user from database based on email
        const query = `*[_type == "user" && email == $email][0]`;
        const user = await (writeClient as any).fetch(query, { email });

        if (!user) {
          console.error('User not found in the database'); // Removed email from log
          throw new Error('User not found.');
        }

        // Compare password with the hashed password in the database
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          console.error('Invalid password attempt'); // Removed email from log
          throw new Error('Invalid email or password.');
        }

        // Dynamic import of urlFor utility
        const { urlFor } = await import('@/utils/imageUrlBuilder');

        return {
          _id: user._id,
          email: user.email,
          image: user.image ? urlFor(user.image) : '',
          location: user.location,
          stripeAccountId: user.stripeAccountId || null,
        } as User;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        // Populate token with user data
        token._id = user._id || token._id;
        token.email = user.email;
        token.location = user.location || {};
        token.stripeAccountId = user.stripeAccountId || null;

        if (account?.provider === 'google') {
          try {
            // Dynamic import of Sanity clients and utilities
            const { readClient, writeClient } = await import(
              '@/studio-m4ktaba/client'
            );
            const { uploadImageToSanity } = await import(
              '@/utils/uploadImageToSanity'
            );

            let existingUser = await (readClient as any).fetch(
              `*[_type == "user" && email == $email][0]`,
              { email: token.email }
            );

            if (!existingUser) {
              const imageRef = user.image
                ? await uploadImageToSanity(user.image)
                : null;

              const newUser = {
                _type: 'user',
                _id: user._id || uuidv4(),
                email: user.email,
                location: user.location || null, // Use null instead of {} to indicate no address set
                image: imageRef || null,
                stripeAccountId: user.stripeAccountId || null,
                profileComplete: false, // Track if profile is complete
              };

              await (writeClient as any).createIfNotExists(newUser);
              existingUser = newUser;
            }

            token._id = existingUser._id;
            token.image = existingUser.image || null; // Preserve Sanity image object
            token.location = existingUser.location || null; // Use null for incomplete profiles
            token.stripeAccountId = existingUser.stripeAccountId || null;
            token.profileComplete = existingUser.profileComplete || false;
          } catch (error) {
            console.error('Error fetching or creating Google user:', error);
          }
        } else {
          token.image = user.image || null;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user._id = token._id;
      session.user.email = token.email;
      session.user.location = token.location;
      session.user.image = token.image || null; // Return the Sanity image object
      session.user.stripeAccountId = token.stripeAccountId || null;

      try {
        // Dynamic import of readClient
        const { readClient } = await import('@/studio-m4ktaba/client');

        const latestUser = await (readClient as any).fetch(
          `*[_type == "user" && _id == $_id][0]{email, image, location, stripeAccountId}`,
          { _id: token._id }
        );

        session.user.image = latestUser?.image || session.user.image; // Keep the image object intact
        session.user.location = latestUser?.location || session.user.location;
        session.user.stripeAccountId =
          latestUser?.stripeAccountId || session.user.stripeAccountId;
      } catch (error) {
        console.error('Error fetching user data for session:', error);
      }

      return session;
    },
  },

  pages: {
    signOut: '/', // Redirect to the root path on sign out
  },
};

export default NextAuth(authOptions);
