import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { magicLink, twoFactor } from "better-auth/plugins";
import { refusesAutomaticLink } from "./lib/account-linking.js";
import { generateBackupCodes } from "./lib/backup-codes.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  
  session: {
    cookieCache: { enabled: true, maxAge: 60 },
  },

  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        const { sendChangeEmailConfirmation } = await import("./lib/email.js");
        await sendChangeEmailConfirmation(user.email, newEmail, url);
      },
    },
    validateUserInfo: async ({ user, source }, ctx) => {
      if (source.method !== "oauth" || source.action !== "link-account") return;
      if (!user.email) return;

      const existing = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, twoFactorEnabled: true },
      });
      if (!existing) return;

      let hasOwnSession = false;
      const token = await ctx.getSignedCookie(
        ctx.context.authCookies.sessionToken.name,
        ctx.context.secret
      );
      if (token) {
        const active = await ctx.context.internalAdapter.findSession(token);
        hasOwnSession = active?.session?.userId === existing.id;
      }

      const refuse = refusesAutomaticLink({
        method: source.method,
        action: source.action,
        twoFactorEnabled: existing.twoFactorEnabled ?? false,
        hasOwnSession,
      });
      if (!refuse) return;

      return {
        error: "two_factor_linking",
        errorDescription:
          "This account uses two-factor authentication. Sign in with your password and a code, then connect this provider from Settings.",
      };
    },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 72,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const { sendPasswordResetEmail } = await import("./lib/email.js");
      await sendPasswordResetEmail(user.email, url);
    },
  },
  
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  
  account: {
    accountLinking: { enabled: true },
  },
  
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const { sendMagicLinkEmail } = await import("./lib/email.js");
      await sendMagicLinkEmail(user.email, url);
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (user.email) {
            const { sendWelcomeEmail } = await import("./lib/email.js");
            await sendWelcomeEmail(user.email, user.name ?? "").catch(console.error);
          }
        },
      },
    },
  },

  plugins: [
    magicLink({
      expiresIn: 15 * 60,
      storeToken: "hashed",
      sendMagicLink: async ({ email, url }) => {
        const { sendMagicLinkEmail } = await import("./lib/email.js");
        await sendMagicLinkEmail(email, url);
      },
    }),
    twoFactor({
      issuer: "LucidDue",
      totpOptions: { digits: 6 },
      skipVerificationOnEnable: false,
      backupCodeOptions: {
        storeBackupCodes: "encrypted",
        customBackupCodesGenerate: generateBackupCodes,
      },
    }),
  ],

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:3000"],
  onAPIError: {
    errorURL: `${process.env.FRONTEND_URL || "http://localhost:3000"}/login`,
  },
});
