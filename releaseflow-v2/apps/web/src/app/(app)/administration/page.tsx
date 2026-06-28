'use client';

import Link from 'next/link';

const adminLinks = [
  { label: 'Organization', href: '/administration', description: 'Organization profile, branding, and settings' },
  { label: 'Members', href: '/administration/members', description: 'Manage organization members and invitations' },
  { label: 'Audit', href: '/administration/audit', description: 'System audit — permissions, activity, integrity' },
  { label: 'Diagnostics', href: '/administration/diagnostics', description: 'System health and environment diagnostics' },
];

export default function AdministrationPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-bold text-text-900 dark:text-surface-50 mb-2">Administration</h1>
      <p className="text-sm text-text-500 mb-8">
        Configure your organization, manage members, and monitor system health.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5 hover:shadow-md transition-shadow"
          >
            <p className="font-medium text-text-900 dark:text-surface-50">{link.label}</p>
            <p className="text-sm text-text-500 mt-1">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
