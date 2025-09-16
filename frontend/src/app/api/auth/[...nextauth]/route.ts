import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

async function refreshAccessToken(token: any) {
  try {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
    });

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to refresh access token");
    }

    return {
      ...token,
      accessToken: data.access_token,
      accessTokenExpires: Date.now() + data.expires_in * 1000,
      // Only update refreshToken if Google returned a new one
      refreshToken: data.refresh_token ?? token.refreshToken,
    };
  } catch (e) {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Request the scope needed to create events
          scope: "openid email profile https://www.googleapis.com/auth/calendar.events",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  url: process.env.NEXTAUTH_URL,
  pages: {
    signIn: '/',
    error: '/',
  },
  callbacks: {
    async jwt({ token, account }: { token: any, account: any }) {
      // Initial sign in
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: Date.now() + (account.expires_in ?? 3600) * 1000,
          // Capture a stable user identifier
          userId: account.providerAccountId ?? token.sub ?? token.userId,
        };
      }

      // Ensure userId persists on subsequent calls
      if (!token.userId && token.sub) {
        token.userId = token.sub;
      }

      // Return previous token if the access token has not expired yet
      if (token.accessToken && token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token has expired, try to refresh it
      if (token.refreshToken) {
        return await refreshAccessToken(token);
      }

      return token;
    },
    async session({ session, token }: { session: any, token: any }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.error = token.error;

      // Put userId on the session user
      session.user = {
        ...session.user,
        id: token.userId ?? token.sub ?? null,
      };

      return session;
    },
    async redirect({ url, baseUrl }: { url: string, baseUrl: string }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/phone`;
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };