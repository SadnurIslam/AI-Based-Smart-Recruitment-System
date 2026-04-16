import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

import { scoreResumeAgainstRequirements } from "../lib/ai-scoring";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const recruiterPassword = await bcrypt.hash("Recruit@123", 12);
  const applicantPassword = await bcrypt.hash("Applicant@123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@devspark.com" },
    update: { role: Role.ADMIN, passwordHash: adminPassword },
    create: {
      name: "DevSpark Admin",
      email: "admin@devspark.com",
      role: Role.ADMIN,
      passwordHash: adminPassword,
      profile: { create: { headline: "Operations lead" } },
    },
  });

  const recruiter = await prisma.user.upsert({
    where: { email: "recruiter@devspark.com" },
    update: { role: Role.RECRUITER, passwordHash: recruiterPassword },
    create: {
      name: "Talent Recruiter",
      email: "recruiter@devspark.com",
      role: Role.RECRUITER,
      passwordHash: recruiterPassword,
      profile: { create: { headline: "Technical recruiter" } },
    },
  });

  const applicant = await prisma.user.upsert({
    where: { email: "applicant@example.com" },
    update: { role: Role.APPLICANT, passwordHash: applicantPassword },
    create: {
      name: "Nadia Rahman",
      email: "applicant@example.com",
      role: Role.APPLICANT,
      passwordHash: applicantPassword,
      profile: {
        create: {
          headline: "Full Stack Developer",
          summary:
            "Motivated developer with project experience in full stack applications and quality-driven engineering.",
          skills: "Next.js, TypeScript, Prisma, PostgreSQL, Node.js, Testing",
          experience:
            "Built an e-commerce app with Next.js and Stripe; Developed role-based dashboard for recruitment workflow",
          education: "BSc in Computer Science, University Project Work",
          projects:
            "Smart Recruitment System, Campus Event Management Portal",
          certifications: "React Developer Certificate",
          location: "Dhaka, Bangladesh",
          phone: "+8801XXXXXXXXX",
        },
      },
    },
  });

  const webDevJob = await prisma.jobPosting.create({
    data: {
      title: "Web Developer",
      department: "Engineering",
      location: "Dhaka (Hybrid)",
      employmentType: "Full-time",
      description:
        "Develop and maintain modern web applications using React and Next.js with strong focus on performance and UX.",
      requirements:
        "Next.js TypeScript React Prisma API integration testing communication teamwork",
      responsibilities:
        "Deliver features, write clean code, collaborate with product and QA teams",
      minExperience: 1,
      status: "OPEN",
      postedById: recruiter.id,
    },
  });

  const sqaJob = await prisma.jobPosting.create({
    data: {
      title: "SQA Engineer",
      department: "Quality Engineering",
      location: "Remote",
      employmentType: "Full-time",
      description: "Ensure product quality through test design, automation, and defect tracking.",
      requirements: "Testing automation selenium playwright api testing bug reporting",
      responsibilities: "Plan test cases, execute test suites, work with developers",
      minExperience: 1,
      status: "OPEN",
      postedById: admin.id,
    },
  });

  const resumeText = `Nadia Rahman\nFull Stack Developer\nSkills: Next.js, TypeScript, Prisma, Testing\nExperience: Built recruitment dashboard and API services with role-based access\nEducation: BSc in Computer Science`;
  const score = scoreResumeAgainstRequirements(resumeText, webDevJob.requirements);

  await prisma.application.upsert({
    where: {
      jobId_applicantId: {
        jobId: webDevJob.id,
        applicantId: applicant.id,
      },
    },
    update: {
      aiScore: score.score,
      aiReasoning: score.reasoning,
      resumeText,
      source: "BUILDER",
    },
    create: {
      jobId: webDevJob.id,
      applicantId: applicant.id,
      resumeText,
      source: "BUILDER",
      aiScore: score.score,
      aiReasoning: score.reasoning,
    },
  });

  console.log("Database seeded.");
  console.log("Admin login: admin@devspark.com / Admin@123");
  console.log("Recruiter login: recruiter@devspark.com / Recruit@123");
  console.log("Applicant login: applicant@example.com / Applicant@123");
  console.log(`Sample jobs created: ${webDevJob.title}, ${sqaJob.title}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
