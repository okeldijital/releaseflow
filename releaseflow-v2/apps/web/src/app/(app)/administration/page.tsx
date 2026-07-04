'use client';

import Link from 'next/link';

const adminLinks = [
  { label: 'Dashboard', href: '/administration/dashboard', description: 'Organization overview, health metrics, and activity' },
  { label: 'Reports', href: '/administration/reports', description: 'Generate and export reports across all domains' },
  { label: 'Analytics', href: '/administration/analytics', description: 'Operational KPIs, turnaround times, and success rates' },
  { label: 'Forecasts', href: '/administration/forecasts', description: 'Release completion forecasts and risk analysis' },
  { label: 'Trends', href: '/administration/trends', description: 'Throughput trends and historical analysis' },
  { label: 'Security', href: '/administration/security', description: 'Sessions, API keys, access control, and permissions' },
  { label: 'Profile', href: '/administration/profile', description: 'Your profile, display name, avatar, timezone, locale' },
  { label: 'Organization', href: '/administration/organization', description: 'Organization details, branding, and logo' },
  { label: 'Members', href: '/administration/members', description: 'Manage members, roles, and permissions' },
  { label: 'Audit', href: '/administration/audit', description: 'System audit — permissions, activity, integrity' },
  { label: 'Diagnostics', href: '/administration/diagnostics', description: 'System health and environment diagnostics' },
  { label: 'Production', href: '/administration/production', description: 'Active specifications, deliverables, review workflows, and bottlenecks' },
];

export default function AdministrationPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8">
        <p className="text-[1.75rem] font-semibold text-surface-50 tracking-tight">Administration</p>
        <p className="mt-1 text-sm text-text-400">Manage your company, members and platform settings.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block rounded-xl border border-surface-200/80 bg-layer-2 px-5 py-5 hover:border-primary-200 hover:shadow-sm transition-all duration-150"
          >
            <p className="font-semibold text-text-900">{link.label}</p>
            <p className="text-sm text-text-500 mt-1">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
