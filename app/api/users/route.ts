import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/user";
import { sendEmail, employeeCreatedEmail } from "@/lib/email";

const verifyAuth = (req: NextRequest) => {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return null;
  }

  return jwt.verify(token, process.env.JWT_SECRET!) as {
    userId: string;
    email: string;
  };
};

export async function GET(req: NextRequest) {
  try {
    const decoded = verifyAuth(req);

    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();

    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const decoded = verifyAuth(req);

    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();

    if (!body?.email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!body?.password?.trim()) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    if (!body?.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const role = body.role || "user";
    if (!["admin", "user"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    await connectDB();

    // Store original password for email before hashing
    const originalPassword = body.password;
    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await User.create({
      email: body.email.trim(),
      password: hashedPassword,
      name: body.name.trim(),
      phoneNumber: body.phoneNumber?.trim(),
      role,
    });

    // Send welcome email with credentials (non-blocking)
    try {
      const emailData = {
        name: user.name || user.email.split("@")[0],
        email: user.email,
        password: originalPassword,
        role: (user.role || "user").charAt(0).toUpperCase() + (user.role || "user").slice(1),
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`,
      };

      const emailContent = employeeCreatedEmail(emailData);

      await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      console.log(`Welcome email sent to ${user.email}`);
    } catch (emailError) {
      // Log email error but don't fail user creation
      console.error("Failed to send welcome email:", emailError);
    }

    return NextResponse.json(
      {
        message: "Employee created successfully",
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          phoneNumber: user.phoneNumber,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}
