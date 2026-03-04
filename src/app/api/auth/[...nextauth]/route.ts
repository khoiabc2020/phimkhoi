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
                if (!credentials?.username || !credentials?.password) {
                    console.log("NextAuth: Missing credentials");
                    return null;
                }

                try {
                    console.log("NextAuth: Connecting to DB...");
                    await dbConnect();
                    console.log("NextAuth: DB Connected. Searching user:", credentials.username);

                    const user = await User.findOne({
                        $or: [
                            { email: credentials.username },
                            { name: credentials.username }
                        ]
                    });

                    // Tạo admin mặc định nếu DB trống
                    if (!user && credentials.username === "admin" && credentials.password === "admin123") {
                        console.log("NextAuth: Creating default admin");
                        const hashed = await bcrypt.hash("admin123", 10);
                        const newAdmin = await User.create({
                            name: "Admin User",
                            email: "admin@khoiphim.com",
                            password: hashed,
                            role: "admin",
                        });
                        return {
                            id: newAdmin._id.toString(),
                            name: newAdmin.name || "Admin",
                            email: newAdmin.email || "admin@khoiphim.com",
                            role: newAdmin.role,
                        } as NextAuthUser;
                    }

                    if (!user) {
                        console.log("NextAuth: User not found for username:", credentials.username);
                        return null;
                    }

                    console.log("NextAuth: User found. Comparing passwords...");
                    const isValid = await bcrypt.compare(credentials.password, user.password || "");
                    if (!isValid) {
                        console.log("NextAuth: Invalid password for user:", credentials.username);
                        return null;
                    }

                    console.log("NextAuth: Login successful for:", credentials.username);
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
        async jwt({ token, user, account }) {
            if (user) {
                token.role = user.role || 'user';
                token.id = user.id;
            }
            if (account?.provider) {
                token.provider = account.provider;
            }
            if (!token.id) {
                token.id = token.sub || token.email || 'anonymous';
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                // @ts-ignore
                session.user.role = token.role;
                session.user.id = (token.id || token.sub || token.email) as string;
                // @ts-ignore
                session.user.provider = token.provider;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login"
    },
    secret: process.env.NEXTAUTH_SECRET,
    trustHost: true,
    debug: true,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
