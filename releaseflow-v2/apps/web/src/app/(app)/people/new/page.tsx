'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrgStore } from '@/stores/org-store';
import { createNewPerson } from '@/lib/person-service';
import { Button, Input, TextArea, Select } from '@releaseflow/ui';
import { toast } from '@/stores/toast-store';

const employmentTypeOptions = [
  { value: 'full_time', label: 'Full-Time' },
  { value: 'part_time', label: 'Part-Time' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'intern', label: 'Intern' },
];

const SKILL_OPTIONS = [
  'Producer', 'Mix Engineer', 'Mastering Engineer', 'Composer', 'Songwriter',
  'A&R', 'Designer', 'Photographer', 'Videographer', 'Marketing', 'Project Manager',
];

export default function NewPersonPage() {
  const router = useRouter();
  const { activeOrgId } = useOrgStore();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [primaryRole, setPrimaryRole] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [employmentType, setEmploymentType] = useState('full_time');
  const [preferredName, setPreferredName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeOrgId) return;
    if (!displayName.trim() || !email.trim()) return;
    setSaving(true);
    try {
      const person = await createNewPerson({
        organizationId: activeOrgId,
        displayName: displayName.trim(),
        email: email.trim(),
        primaryRole: primaryRole.trim() || '—',
        department: department.trim() || null,
        position: position.trim() || null,
        employmentType: employmentType,
        preferredName: preferredName.trim() || null,
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        skills: skills.length > 0 ? skills : null,
      });
      toast.success('Person created');
      router.push(`/people/${person.id}`);
    } catch (err) {
      toast.error('Failed to create person', (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8">
        <p className="text-display-md font-semibold text-primary-400 tracking-tight">Add Person</p>
        <p className="mt-1 text-sm text-text-400">Add a new team member to your organization.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Display Name *" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          <Input label="Email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Preferred Name" value={preferredName} onChange={(e) => setPreferredName(e.target.value)} />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Primary Role" value={primaryRole} onChange={(e) => setPrimaryRole(e.target.value)} placeholder="e.g. Mastering Engineer" />
          <Select label="Employment Type" options={employmentTypeOptions} value={employmentType} onChange={(v) => setEmploymentType(v)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Production" />
          <Input label="Position" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Senior Engineer" />
        </div>
        <TextArea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
        <div>
          <p className="text-xs font-medium text-text-400 mb-1.5">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {SKILL_OPTIONS.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => setSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill])}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  skills.includes(skill)
                    ? 'bg-primary-500/10 text-primary-400 border border-primary-500/30'
                    : 'bg-surface-800 text-text-500 border border-surface-700/60 hover:border-primary-500/30'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-4">
          <Button type="submit" loading={saving} disabled={saving || !displayName.trim() || !email.trim()}>
            Create Person
          </Button>
          <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
