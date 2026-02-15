import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) return null;

                await dbConnect();

                // 1. Check if user exists
                const user = await User.findOne({
                    $or: [
                        { email: credentials.username },
                        { name: credentials.username }
                    ]
                });

                // 2. Mock Admin for initial setup if DB is empty/first run
                if (!user && credentials.username === "admin" && credentials.password === "admin123") {
                    return {
                        id: "admin_mock_id",
                        name: "Admin User",
                        email: "admin@khoiphim.com",
                        role: "admin",
                    };
                }

                if (!user) return null;

                // 3. Verify password
                const isValid = await bcrypt.compare(credentials.password, user.password || "");

                if (!isValid) return null;

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    image: user.image,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session?.user) {
                session.user.role = token.role;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
