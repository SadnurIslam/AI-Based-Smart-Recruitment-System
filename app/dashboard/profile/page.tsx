import { updateProfileAction } from "@/app/actions/recruitment";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ProfilePageProps = {
  searchParams?: {
    saved?: string;
    welcome?: string;
  };
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const user = await requireRole(["APPLICANT"]);

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
  });

  return (
    <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
      <h1 className="text-3xl font-bold text-slate-900">Applicant Profile</h1>
      <p className="mt-2 text-sm text-slate-700">
        Keep profile updated to improve AI resume quality and matching score accuracy.
      </p>

      {searchParams?.saved || searchParams?.welcome ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Profile data saved successfully.
        </p>
      ) : null}

      <form action={updateProfileAction} className="mt-6 grid gap-4 md:grid-cols-2">
        <input
          className="input-field md:col-span-2"
          name="headline"
          defaultValue={profile?.headline || ""}
          placeholder="Headline (e.g., Full Stack Developer)"
        />
        <input
          className="input-field"
          name="phone"
          defaultValue={profile?.phone || ""}
          placeholder="Phone"
        />
        <input
          className="input-field"
          name="location"
          defaultValue={profile?.location || ""}
          placeholder="Location"
        />
        <input
          className="input-field"
          name="linkedin"
          defaultValue={profile?.linkedin || ""}
          placeholder="LinkedIn URL"
        />
        <input
          className="input-field"
          name="github"
          defaultValue={profile?.github || ""}
          placeholder="GitHub URL"
        />

        <textarea
          className="text-area md:col-span-2"
          name="summary"
          defaultValue={profile?.summary || ""}
          placeholder="Professional summary"
        />
        <textarea
          className="text-area md:col-span-2"
          name="skills"
          defaultValue={profile?.skills || ""}
          placeholder="Skills (comma/new line separated)"
        />
        <textarea
          className="text-area md:col-span-2"
          name="experience"
          defaultValue={profile?.experience || ""}
          placeholder="Experience highlights"
        />
        <textarea
          className="text-area md:col-span-2"
          name="education"
          defaultValue={profile?.education || ""}
          placeholder="Education"
        />
        <textarea
          className="text-area md:col-span-2"
          name="projects"
          defaultValue={profile?.projects || ""}
          placeholder="Projects"
        />
        <textarea
          className="text-area md:col-span-2"
          name="certifications"
          defaultValue={profile?.certifications || ""}
          placeholder="Certifications"
        />

        <button type="submit" className="btn-main md:w-fit">
          Save profile
        </button>
      </form>
    </article>
  );
}
