import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password.");
        }

        try {
          const cleanEmail = credentials.email.trim().toLowerCase();

          const user = await prisma.user.findFirst({
            where: {
              email: {
                equals: cleanEmail,
                mode: "insensitive",
              },
            },
          });

          if (!user) {
            throw new Error("No account found with this email. Please check your spelling or sign up.");
          }

          if (user.isBlocked) {
            throw new Error("Your account has been suspended by administration.");
          }

          if (!user.password) {
            throw new Error("This account was signed up via Google. Please click 'Continue with Google' to sign in.");
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            throw new Error("Incorrect password. Please verify your password and try again.");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
          };
        } catch (err: any) {
          console.error("Authorize error:", err.message || err);
          throw err;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.avatar = (user as any).avatar && (user as any).avatar.startsWith("data:") ? null : (user as any).avatar;
        token.guideStatus = (user as any).guideStatus;
        token.walletAddress = (user as any).walletAddress;
      }
      if (trigger === "update" && session) {
        if (session.walletAddress !== undefined) {
          token.walletAddress = session.walletAddress;
        }
        if (session.name !== undefined) token.name = session.name;
        if (session.role !== undefined) token.role = session.role;
        if (session.avatar !== undefined) token.avatar = session.avatar;
      }
      // Always fetch the freshest user role, guideStatus and walletAddress from the database safely
      if (token.email) {
        try {
          const cleanEmail = (token.email as string).trim().toLowerCase();
          const dbUser = await prisma.user.findFirst({
            where: {
              email: {
                equals: cleanEmail,
                mode: "insensitive",
              },
            },
            select: { id: true, role: true, avatar: true, guideStatus: true, isBlocked: true, walletAddress: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.avatar = dbUser.avatar && dbUser.avatar.startsWith("data:") ? null : dbUser.avatar;
            token.guideStatus = dbUser.guideStatus;
            token.isBlocked = dbUser.isBlocked;
            token.walletAddress = dbUser.walletAddress;
          }
        } catch (err) {
          console.warn("JWT db sync error:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).avatar = token.avatar;
        (session.user as any).guideStatus = token.guideStatus;
        (session.user as any).isBlocked = token.isBlocked;
        (session.user as any).walletAddress = token.walletAddress;
      }
      return session;
    },
    async signIn({ user, account }) {
      try {
        if (user.email) {
          const cleanEmail = user.email.trim().toLowerCase();
          const dbUser = await prisma.user.findFirst({
            where: {
              email: {
                equals: cleanEmail,
                mode: "insensitive",
              },
            },
          });
          if (dbUser?.isBlocked) {
            return false;
          }
          if (account?.provider === "google") {
            if (!dbUser) {
              await prisma.user.create({
                data: {
                  email: cleanEmail,
                  name: user.name || "Google User",
                  avatar: user.image,
                  role: "TOURIST",
                },
              });
            }
          }
        }
        return true;
      } catch (err) {
        console.error("signIn callback error:", err);
        return true;
      }
    },
    async redirect({ url, baseUrl }) {
      // 1. Explicitly honor guide verification target
      if (url.includes("/auth/verify-guide")) {
        return `${baseUrl}/auth/verify-guide`;
      }
      // 2. Allows relative callback URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // 3. Allows callback URLs on the same origin
      try {
        const parsed = new URL(url);
        if (
          parsed.origin === baseUrl ||
          parsed.host.includes("localhost") ||
          parsed.host.includes("127.0.0.1") ||
          parsed.host.includes("guidebloc.com")
        ) {
          return url;
        }
      } catch {}
      return baseUrl;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
