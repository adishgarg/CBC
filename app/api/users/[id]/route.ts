import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/user";

const getAuthPayload = (req: NextRequest) => {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return null;
  }

  return jwt.verify(token, process.env.JWT_SECRET!) as {
    userId: string;
    email: string;
  };
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getAuthPayload(req);

    if (!payload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const user = await User.findById(id).select("-password");

    if (!user) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Fetch employee error:", error);
    return NextResponse.json({ error: "Failed to fetch employee" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getAuthPayload(req);

    if (!payload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    const body = await req.json();
    const name = body?.name?.trim();
    const email = body?.email?.trim();
    const phoneNumber = body?.phoneNumber?.trim();
    const role = body?.role || "user";
    const password = body?.password?.trim();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!["admin", "user"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    await connectDB();

    const existingUser = await User.findOne({ email, _id: { $ne: id } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Another employee already uses that email" },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, string> = {
      name,
      email,
      phoneNumber: phoneNumber || "",
      role,
    };

    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }

      updatePayload.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(
      { user: updatedUser, message: "Employee updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update employee error:", error);
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getAuthPayload(req);

    if (!payload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    if (payload.userId === id) {
      return NextResponse.json(
        { error: "You cannot delete your own account from the employees screen" },
        { status: 400 }
      );
    }

    await connectDB();

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Employee deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete employee error:", error);
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
  }
}