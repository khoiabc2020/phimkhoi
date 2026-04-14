import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextAuthOptions, User as NextAuthUser } from "next-auth";

export const authOptions: NextAuthOptions = {
    providers: [
        // Google OAuth
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id' ? [
            GoogleProvider({
                clientId: process.env.GOOGLE_CLIENT_ID!,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            })
        ] : []),

        // Facebook OAuth
        ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_ID !== 'your_facebook_app_id' ? [
            FacebookProvider({
                clientId: process.env.FACEBOOK_CLIENT_ID!,
                clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
            })
        ] : []),

        // Email/Password
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) return null;

                try {
                    await dbConnect();

                    const user = await User.findOne({
                        $or: [
                            { email: credentials.username },
                            { name: credentials.username }
                        ]
                    });

                    if (!user) return null;

                    const isValid = await bcrypt.compare(credentials.password, user.password || "");
                    if (!isValid) return null;

                    return {
                        id: user._id.toString(),
                        name: user.name || "User",
                        email: user.email || "user@site.com",
                        role: user.role,
                        image: user.image,
                    } as NextAuthUser;
                } catch (error) {
                    console.error("NextAuth Authorize Error:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            // Tự động tạo tài khoản khi đăng nhập bằng Google/Facebook
            if (account?.provider === 'google' || account?.provider === 'facebook') {
                try {
                    await dbConnect();
                    const existingUser = await User.findOne({ email: user.email });
                    if (!existingUser) {
                        await User.create({
                            name: user.name,
                            email: user.email,
                            image: user.image,
                            role: 'user',
                            provider: account.provider,
                        });
                    }
                } catch (error) {
                    console.error('OAuth signIn error:', error);
                }
            }
            return true;
        },
        async jwt({ token, user, account, trigger, session: sessionUpdate }) {
            if (user) {
                token.role = user.role || 'user';
                token.id = user.id;
                token.image = user.image;
            }
            if (account?.provider) {
                token.provider = account.provider;
            }
            if (!token.id) {
                token.id = token.sub || token.email || 'anonymous';
            }
            // Handle session update trigger (e.g. after avatar change)
            if (trigger === "update" && sessionUpdate?.image !== undefined) {
                token.image = sessionUpdate.image;
            }
            if (trigger === "update" && sessionUpdate?.name !== undefined) {
                token.name = sessionUpdate.name;
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                const updatedUser: any = session.user;
                updatedUser.role = token.role;
                updatedUser.id = (token.id || token.sub || token.email) as string;
                updatedUser.provider = token.provider;
                // Sync image from token (updated via session.update())
                if (token.image !== undefined) {
                    updatedUser.image = token.image as string;
                }
                if (token.name) {
                    updatedUser.name = token.name as string;
                }
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login"
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
