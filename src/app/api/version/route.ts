import { NextResponse } from "next/server";

// This value will be baked into the server build
const BUILD_TIME = Date.now().toString();

export async function GET() {
    return NextResponse.json({ version: BUILD_TIME });
}
