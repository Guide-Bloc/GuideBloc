import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    const body = await req.json();
    const { certificationFile, certificationText, country, userEmail } = body;
    const targetEmail = session?.user?.email || userEmail;

    if (!targetEmail) {
      return NextResponse.json(
        { message: "Unauthorized. Please connect your Google account first." },
        { status: 401 }
      );
    }

    if (!certificationFile) {
      return NextResponse.json(
        { message: "A valid certificate file is required." },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User account not found." },
        { status: 404 }
      );
    }

    // Update user to Guide with PENDING status and store certification
    const updatedUser = await prisma.user.update({
      where: { email: targetEmail },
      data: {
        role: "GUIDE",
        guideStatus: "PENDING",
        certificationFile: certificationFile,
        certificationText: certificationText || "Submitted via Google Tour Guide Onboarding",
        ...(country ? { country } : {}),
      },
    });

    // Attempt to trigger welcome/confirmation email
    try {
      const { triggerWelcomeEmail } = await import("@/lib/email");
      await triggerWelcomeEmail(user.email.toLowerCase(), user.name, "GUIDE");
    } catch (err) {
      console.warn("Welcome email notification error (non-fatal):", err);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Credentials submitted successfully. Your guide profile is under review.",
        userId: updatedUser.id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Verify guide error:", error);
    return NextResponse.json(
      { message: error?.message || "Internal server error occurred." },
      { status: 500 }
    );
  }
}
