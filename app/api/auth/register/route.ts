import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password, role, country, certificationText, certificationFile } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: "insensitive",
        },
      },
    });

    const isApplyingGuide = role === "GUIDE";

    if (existingUser) {
      if (existingUser.password) {
        return NextResponse.json(
          { message: "Email is already registered. Please sign in." },
          { status: 409 }
        );
      }

      // Existing Google OAuth user setting a password for credentials login
      const hashedPassword = await bcrypt.hash(password, 12);
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: name.trim() || existingUser.name,
          password: hashedPassword,
          ...(isApplyingGuide ? {
            role: "GUIDE",
            guideStatus: "PENDING",
            certificationText: certificationText || existingUser.certificationText,
            certificationFile: certificationFile || existingUser.certificationFile,
          } : {}),
          ...(country ? { country } : {}),
        },
      });

      return NextResponse.json(
        { message: "Password set and account updated successfully", userId: updatedUser.id },
        { status: 200 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: isApplyingGuide ? "GUIDE" : "TOURIST",
        guideStatus: isApplyingGuide ? "PENDING" : "NONE",
        certificationText: isApplyingGuide ? certificationText : null,
        certificationFile: isApplyingGuide ? certificationFile : null,
        country: country || null,
      },
    });

    // Trigger welcome email asynchronously without blocking the response
    import("@/lib/email")
      .then(({ triggerWelcomeEmail }) => triggerWelcomeEmail(cleanEmail, name.trim(), user.role))
      .catch((err) => console.error("Welcome email error:", err));

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
