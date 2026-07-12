import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/user";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET!);

    await connectDB();

    const workers = await User.find()
      .select("_id name email role")
      .sort({ name: 1, email: 1 });

    return NextResponse.json({ workers }, { status: 200 });
  } catch (error) {
    console.error("Fetch workers error:", error);
    return NextResponse.json({ error: "Failed to fetch workers" }, { status: 500 });
  }
}
