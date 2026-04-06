import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error(
        "Please define the MONGODB_URI environment variable inside .env.local"
    );
}

interface MongooseCache {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
}

declare global {
    var mongoose: MongooseCache;
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const CONNECT_TIMEOUT_MS = Number(process.env.MONGODB_CONNECT_TIMEOUT_MS || 2500);

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        // Connection attempts should never block requests for too long,
        // otherwise Cloudflare may return 502/Bad gateway.
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error(`MongoDB connect timeout after ${CONNECT_TIMEOUT_MS}ms`));
            }, CONNECT_TIMEOUT_MS);
        });

        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
            // Keep 5 connections ready; allow up to 20 for concurrent requests
            minPoolSize: 5,
            maxPoolSize: 20,
            // Return a connection to the pool quickly after each operation
            socketTimeoutMS: 30000,
        };

        cached.promise = Promise.race([
            mongoose.connect(MONGODB_URI!, opts).then((mongoose) => mongoose.connection),
            timeoutPromise,
        ]).catch((err) => {
            // Reset so next request can retry (do not keep a timed-out promise forever)
            cached.promise = null;
            cached.conn = null;
            throw err;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
