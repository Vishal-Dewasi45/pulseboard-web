import { Zap, CheckCircle2,LayoutDashboard,Users,Activity,ArrowUpRight} from "lucide-react";

const points = [
  {
    icon: LayoutDashboard,
    title: "Organize your projects",
    description: "Manage tasks with intuitive Kanban boards.",
  },
  {
    icon: Users,
    title: "Work better together",
    description: "Keep your entire team connected.",
  },
  {
    icon: Activity,
    title: "Stay in sync",
    description: "Get real-time updates and activity insights.",
  },
];

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-2">

      {/* LEFT BRANDING SECTION */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">

        {/* Background Decorations */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

        {/* Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-blue-700 shadow-xl shadow-black/10">
            <Zap size={25} fill="currentColor" />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              PulseBoard
            </h2>
            <p className="text-xs font-medium tracking-widest text-blue-200">
              WORK SMARTER. TOGETHER.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 my-12 max-w-xl">

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-white/10 px-4 py-2 text-xs font-medium text-blue-100 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Your team's workspace
          </div>

          <h1 className="text-4xl font-bold leading-[1.2] tracking-tight xl:text-5xl">
            Bring your team's work
            <span className="mt-2 block text-blue-300">
              into focus.
            </span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-7 text-blue-100/75">
            One workspace to organize projects, manage tasks,
            collaborate with your team and keep everything moving forward.
          </p>

          {/* Features */}
          <div className="mt-10 space-y-5">
            {points.map((point) => {
              const Icon = point.icon;

              return (
                <div key={point.title} className="flex items-center gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/10 text-blue-200">
                    <Icon size={20} />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {point.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-blue-100/60">
                      {point.description}
                    </p>
                  </div>

                  <CheckCircle2
                    size={17}
                    className="ml-auto shrink-0 text-blue-300"
                  />
                </div>
              );
            })}
          </div>

          {/* Decorative Card */}
          <div className="mt-12 max-w-sm rounded-2xl border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/10 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-100/70">
                WORKSPACE OVERVIEW
              </span>
              <ArrowUpRight size={17} className="text-blue-300" />
            </div>

            <div className="mt-5 flex items-end gap-2">
              <div className="h-2 w-2/5 rounded-full bg-blue-300" />
              <div className="h-2 w-1/4 rounded-full bg-indigo-300" />
              <div className="h-2 flex-1 rounded-full bg-white/20" />
            </div>

            <div className="mt-4 flex justify-between text-xs text-blue-100/60">
              <span>Plan</span>
              <span>Track</span>
              <span>Complete</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6">
          <p className="text-xs text-blue-100/50">
            © {new Date().getFullYear()} PulseBoard. All rights reserved.
          </p>

          <span className="text-xs text-blue-100/50">
            Built for better teamwork.
          </span>
        </div>
      </section>

      {/* RIGHT AUTH SECTION */}
      <section className="relative flex min-h-dvh items-center justify-center bg-white px-6 py-10 sm:px-12 lg:px-10 xl:px-16">

        <div className="w-full max-w-md">

          {/* Mobile Branding */}
          <div className="mb-12 flex items-center gap-2.5 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <Zap size={21} fill="currentColor" />
            </div>

            <span className="text-xl font-bold tracking-tight text-slate-900">
              PulseBoard
            </span>
          </div>

          {/* Form Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {subtitle}
              </p>
            )}
          </div>

          {/* Form Content */}
          {children}

          <p className="mt-10 text-center text-xs text-slate-400">
            Secure workspace for modern teams.
          </p>
        </div>
      </section>
    </div>
  );
}