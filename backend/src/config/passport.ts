import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const clientID = process.env.GOOGLE_CLIENT_ID ?? 'placeholder-client-id';
const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? 'placeholder-client-secret';
const callbackURL = process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:5000/api/auth/google/callback';

passport.use(
  new GoogleStrategy(
    {
      clientID,
      clientSecret,
      callbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Google profile'), undefined);
        }

        // Check if user already exists
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          // Auto-provision user
          const randomPassword = Math.random().toString(36) + Math.random().toString(36);
          const hashedPassword = await bcrypt.hash(randomPassword, 12);
          
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName || profile.name?.givenName || 'Google User',
              password: hashedPassword,
              domain: 'cse', // Default domain
              tier: 'Explorer',
              xp: 0,
            },
          });
          console.log(`Auto-provisioned new Google user: ${email}`);
        }

        return done(null, user);
      } catch (err) {
        return done(err, undefined);
      }
    }
  )
);

// Serialize / Deserialize (though we are using stateless JWTs, Passport requires these)
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
