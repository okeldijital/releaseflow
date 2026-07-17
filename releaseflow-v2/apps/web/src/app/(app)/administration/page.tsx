'use client';

import { useRouter } from 'next/navigation';
import { MetricCard } from '@releaseflow/ui';
import { TrackRow, TrackList } from '@/components/shared/track-row';

const stats = [
  { label: 'Members', value: 12 },
  { label: 'Releases', value: 184 },
  { label: 'Tracks', value: '1,236' },
  { label: 'Artists', value: 428 },
];

interface AdminLink {
  label: string;
  href: string;
  description: string;
  icon: React.ReactNode;
}

function Chevron() {
  return (
    <svg className="h-4 w-4 text-content-label" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-layer-3 text-content-secondary">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        {children}
      </svg>
    </span>
  );
}

const sections: { title: string; links: AdminLink[] }[] = [
  {
    title: 'Organisation',
    links: [
      {
        label: 'Organisation',
        href: '/administration/organization',
        description: 'Organisation details and settings.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01" />,
      },
      {
        label: 'Branding',
        href: '/administration/organization',
        description: 'Logo, colours and identity.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2H7zM14 3v5h5M9 13h6M9 17h6" />,
      },
      {
        label: 'Members',
        href: '/administration/members',
        description: 'Manage members and invites.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-1a4 4 0 00-3-3.87M9 20H4v-1a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zM16 7a3 3 0 10-3-3" />,
      },
      {
        label: 'Roles & Permissions',
        href: '/administration/members',
        description: 'Access control and roles.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM8 11V7a4 4 0 018 0v4" />,
      },
    ],
  },
  {
    title: 'Workspace',
    links: [
      {
        label: 'Profile',
        href: '/administration/profile',
        description: 'Your profile and preferences.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
      },
      {
        label: 'Notifications',
        href: '/administration/profile',
        description: 'Notification preferences.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
      },
      {
        label: 'Security',
        href: '/administration/security',
        description: 'Security settings.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM8 11V7a4 4 0 018 0v4" />,
      },
    ],
  },
  {
    title: 'ReleaseFlow',
    links: [
      {
        label: 'Production',
        href: '/administration/production',
        description: 'Specifications and deliverables.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-2v13M9 19a3 3 0 11-6 0 3 3 0 016 0zm12-1a3 3 0 11-6 0 3 3 0 016 0z" />,
      },
      {
        label: 'Diagnostics',
        href: '/administration/diagnostics',
        description: 'System health and diagnostics.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 14h6" />,
      },
      {
        label: 'Audit Log',
        href: '/administration/audit',
        description: 'Activity and integrity log.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      },
    ],
  },
  {
    title: 'Analytics',
    links: [
      {
        label: 'Reports',
        href: '/administration/reports',
        description: 'Generate reports.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6m3 6V7m3 10v-3M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />,
      },
      {
        label: 'Analytics',
        href: '/administration/analytics',
        description: 'View analytics.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M7 15l4-4 3 3 5-6" />,
      },
    ],
  },
];

export default function AdministrationPage() {
  const router = useRouter();

  function navigate(href: string) {
    router.push(href);
  }

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8">
        <p className="text-display-md font-semibold text-primary-400 tracking-tight">Administration</p>
        <p className="mt-1 text-sm text-text-400">Manage your organisation, members and platform settings.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <MetricCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-content-label mb-3 px-1">
              {section.title}
            </h2>
            <TrackList>
              {section.links.map((link) => (
                <TrackRow
                  key={link.href + link.label}
                  onClick={() => navigate(link.href)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(link.href);
                    }
                  }}
                  aria-label={link.label}
                >
                  <Icon>{link.icon}</Icon>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-content-primary truncate group-hover:text-primary-400 transition-colors">
                      {link.label}
                    </p>
                    <p className="text-xs text-content-secondary mt-0.5 truncate">{link.description}</p>
                  </div>
                  <Chevron />
                </TrackRow>
              ))}
            </TrackList>
          </section>
        ))}
      </div>
    </div>
  );
}
