export default function HomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      <p className="text-sm text-slate-600">
        This is your project tracker. Start by creating a project.
      </p>
      <a
        href="/projects"
        className="inline-flex rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white"
      >
        Go to Projects
      </a>
    </div>
  );
}
