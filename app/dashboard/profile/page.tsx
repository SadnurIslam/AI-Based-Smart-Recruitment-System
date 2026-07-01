import { updateProfileAction } from "@/app/actions/recruitment";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ProfilePageProps = {
  searchParams?: Promise<{
    saved?: string;
    welcome?: string;
  }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const user = await requireRole(["APPLICANT"]);
  const params = await searchParams;
  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });

  const profileFields = [
    profile?.headline,
    profile?.summary,
    profile?.skills,
    profile?.experience,
    profile?.education,
    profile?.phone,
    profile?.location,
  ];
  const profileCompletion = Math.round(
    (profileFields.filter((v) => Boolean(v && v.trim())).length / profileFields.length) * 100
  );

  const sections = [
    {
      title: "Basic Info",
      fields: [
        { name: "headline", label: "Headline", placeholder: "e.g. Full Stack Developer at Acme Corp", defaultValue: profile?.headline || "", type: "input", span: 2 },
        { name: "phone", label: "Phone", placeholder: "+880 1XXX XXXXXX", defaultValue: profile?.phone || "", type: "input" },
        { name: "location", label: "Location", placeholder: "City, Country", defaultValue: profile?.location || "", type: "input" },
        { name: "linkedin", label: "LinkedIn URL", placeholder: "https://linkedin.com/in/...", defaultValue: profile?.linkedin || "", type: "input" },
        { name: "github", label: "GitHub URL", placeholder: "https://github.com/...", defaultValue: profile?.github || "", type: "input" },
      ],
    },
    {
      title: "Professional Summary",
      fields: [
        { name: "summary", label: "Summary", placeholder: "A compelling overview of your background, strengths, and goals.", defaultValue: profile?.summary || "", type: "textarea", span: 2 },
      ],
    },
    {
      title: "Skills & Expertise",
      fields: [
        { name: "skills", label: "Skills", placeholder: "React, Node.js, PostgreSQL, Docker, TypeScript…", defaultValue: profile?.skills || "", type: "textarea", span: 2 },
      ],
    },
    {
      title: "Experience",
      fields: [
        { name: "experience", label: "Work Experience", placeholder: "Senior Engineer at Acme (2021–present) – built X, improved Y by Z%…", defaultValue: profile?.experience || "", type: "textarea", span: 2 },
      ],
    },
    {
      title: "Education",
      fields: [
        { name: "education", label: "Education", placeholder: "B.Sc. Computer Science, University of Dhaka (2018)", defaultValue: profile?.education || "", type: "textarea", span: 2 },
      ],
    },
    {
      title: "Projects & Certifications",
      fields: [
        { name: "projects", label: "Projects", placeholder: "Built a real-time chat app with 1k+ users…", defaultValue: profile?.projects || "", type: "textarea" },
        { name: "certifications", label: "Certifications", placeholder: "AWS Solutions Architect Associate (2023)…", defaultValue: profile?.certifications || "", type: "textarea" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">My Profile</h1>
            <p className="mt-1 text-sm text-slate-400">
              Keep this updated to improve AI resume quality and job match accuracy.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500">Completion</p>
            <p className="text-3xl font-bold text-white">{profileCompletion}%</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 w-full rounded-full bg-slate-800">
          <div
            className="h-2 rounded-full bg-teal-500 transition-all"
            style={{ width: `${profileCompletion}%` }}
          />
        </div>

        {(params?.saved || params?.welcome) && (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-400">
            ✓ Profile saved successfully.
          </p>
        )}
      </article>

      {/* Profile form */}
      <form action={updateProfileAction} className="space-y-6">
        {sections.map((section) => (
          <article key={section.title} className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
            <h2 className="text-lg font-bold text-white mb-4">{section.title}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {section.fields.map((field) =>
                field.type === "textarea" ? (
                  <textarea
                    key={field.name}
                    name={field.name}
                    defaultValue={field.defaultValue}
                    placeholder={field.placeholder}
                    rows={4}
                    className={`text-area ${(field as { span?: number }).span === 2 ? "md:col-span-2" : ""}`}
                  />
                ) : (
                  <input
                    key={field.name}
                    name={field.name}
                    defaultValue={field.defaultValue}
                    placeholder={field.placeholder}
                    className={`input-field ${(field as { span?: number }).span === 2 ? "md:col-span-2" : ""}`}
                  />
                )
              )}
            </div>
          </article>
        ))}

        <div className="flex flex-wrap gap-3 pb-4">
          <button type="submit" className="btn-main">
            Save Profile
          </button>
          <a href="/dashboard/resume-builder" className="btn-soft">
            Build Resume →
          </a>
        </div>
      </form>
    </div>
  );
}
