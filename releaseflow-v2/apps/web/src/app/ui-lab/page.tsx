'use client';

import { useState } from 'react';
import {
  Button, Card, MetricCard,
  Badge, StatusBadge,
  ProgressBar, HealthBar,
  EmptyState, LoadingState, Skeleton,
  Input, TextArea, Select,
  Checkbox, Radio, Switch,
  Table, Tabs,
  Alert, Banner, Toast,
  InlineMessage, ConfirmationDialog, Notification,
  Tag, Divider, SegmentedControl,
  Typography,
} from '@releaseflow/ui';
import {
  ReleaseJourney, HealthRing, ReadinessStack,
  WorkflowBoard, OperationalSummary,
} from '@releaseflow/domain-ui';

export default function UiLabPage() {
  const [inputText, setInputText] = useState('');
  const [selectVal, setSelectVal] = useState('option1');
  const [textAreaVal, setTextAreaVal] = useState('');
  const [switched, setSwitched] = useState(false);
  const [radioVal, setRadioVal] = useState('a');
  const [checked, setChecked] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('buttons');
  const [segVal, setSegVal] = useState('all');

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Typography variant="h1">UI Laboratory</Typography>
            <Typography variant="bodyLarge">PDS-10 / PDS-13 Component Verification</Typography>
          </div>
          <Badge label="v0.1.0" color="bg-primary-50 text-primary-700" size="md" />
        </div>

        <Tabs
          tabs={[
            { id: 'buttons', label: 'Buttons' },
            { id: 'cards', label: 'Cards' },
            { id: 'inputs', label: 'Inputs' },
            { id: 'feedback', label: 'Feedback' },
            { id: 'display', label: 'Display' },
            { id: 'domain', label: 'Domain' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="underline"
          className="mb-8"
        />

        {activeTab === 'buttons' && <ButtonsSection />}
        {activeTab === 'cards' && <CardsSection />}
        {activeTab === 'inputs' && <InputsSection
          inputText={inputText} setInputText={setInputText}
          selectVal={selectVal} setSelectVal={setSelectVal}
          textAreaVal={textAreaVal} setTextAreaVal={setTextAreaVal}
          switched={switched} setSwitched={setSwitched}
          radioVal={radioVal} setRadioVal={setRadioVal}
          checked={checked} setChecked={setChecked}
          segVal={segVal} setSegVal={setSegVal}
        />}
        {activeTab === 'feedback' && <FeedbackSection showConfirm={showConfirm} setShowConfirm={setShowConfirm} />}
        {activeTab === 'display' && <DisplaySection />}
        {activeTab === 'domain' && <DomainSection />}
      </div>
    </div>
  );
}

function ButtonsSection() {
  return (
    <div className="space-y-8">
      <section>
        <Typography variant="h3">Button Variants</Typography>
        <div className="flex flex-wrap gap-3 mt-4">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
      </section>

      <section>
        <Typography variant="h3">Button Sizes</Typography>
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section>
        <Typography variant="h3">Button States</Typography>
        <div className="flex flex-wrap gap-3 mt-4">
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button variant="outline" loading>Outline Loading</Button>
        </div>
      </section>
    </div>
  );
}

function CardsSection() {
  return (
    <div className="space-y-8">
      <section>
        <Typography variant="h3">Card Variants</Typography>
        <div className="grid gap-4 sm:grid-cols-3 mt-4">
          <Card padding="sm"><Typography variant="bodySmall">Small padding card</Typography></Card>
          <Card padding="md"><Typography variant="body">Medium padding card</Typography></Card>
          <Card padding="lg"><Typography variant="bodyLarge">Large padding card</Typography></Card>
        </div>
      </section>

      <section>
        <Typography variant="h3">Interactive Cards</Typography>
        <div className="grid gap-4 sm:grid-cols-3 mt-4">
          <Card hover clickable padding="md">
            <Typography variant="bodySmall">Hover + Clickable</Typography>
          </Card>
          <Card hover padding="md">
            <Typography variant="bodySmall">Hover only</Typography>
          </Card>
          <Card clickable padding="md">
            <Typography variant="bodySmall">Clickable only</Typography>
          </Card>
        </div>
      </section>

      <section>
        <Typography variant="h3">MetricCard</Typography>
        <div className="grid gap-4 sm:grid-cols-3 mt-4">
          <MetricCard label="Total Releases" value={42} />
          <MetricCard label="Completed" value={38} trend="up" trendValue="+12%" />
          <MetricCard label="Drafts" value={4} trend="down" trendValue="-2" />
        </div>
      </section>
    </div>
  );
}

function InputsSection({ inputText, setInputText, selectVal, setSelectVal, textAreaVal, setTextAreaVal, switched, setSwitched, radioVal, setRadioVal, checked, setChecked, segVal, setSegVal }: {
  inputText: string; setInputText: (v: string) => void;
  selectVal: string; setSelectVal: (v: string) => void;
  textAreaVal: string; setTextAreaVal: (v: string) => void;
  switched: boolean; setSwitched: (v: boolean) => void;
  radioVal: string; setRadioVal: (v: string) => void;
  checked: boolean; setChecked: (v: boolean) => void;
  segVal: string; setSegVal: (v: string) => void;
}) {
  return (
    <div className="space-y-8">
      <section>
        <Typography variant="h3">Input</Typography>
        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          <Input label="Name" placeholder="Enter name" value={inputText} onChange={(e) => setInputText(e.target.value)} />
          <Input label="Email" type="email" placeholder="Enter email" hint="We'll never share your email" />
          <Input label="With Error" value="bad" error="This field is required" onChange={() => {}} />
          <Input label="Disabled" value="Can't touch this" disabled />
        </div>
      </section>

      <section>
        <Typography variant="h3">Select</Typography>
        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          <Select label="Fruit" options={[{ value: 'option1', label: 'Apple' }, { value: 'option2', label: 'Banana' }, { value: 'option3', label: 'Cherry' }]} value={selectVal} onChange={setSelectVal} />
          <Select label="With Error" options={[{ value: 'a', label: 'A' }]} value="b" error="Invalid selection" onChange={() => {}} />
        </div>
      </section>

      <section>
        <Typography variant="h3">TextArea</Typography>
        <div className="mt-4 max-w-md">
          <TextArea label="Description" placeholder="Enter description" value={textAreaVal} onChange={(e) => setTextAreaVal(e.target.value)} />
        </div>
      </section>

      <section>
        <Typography variant="h3">Checkbox & Radio</Typography>
        <div className="flex flex-wrap gap-6 mt-4">
          <Checkbox label="Accept terms" checked={checked} onChange={setChecked} />
          <div className="space-y-2">
            <Radio label="Option A" checked={radioVal === 'a'} onChange={() => setRadioVal('a')} />
            <Radio label="Option B" checked={radioVal === 'b'} onChange={() => setRadioVal('b')} />
          </div>
        </div>
      </section>

      <section>
        <Typography variant="h3">Switch</Typography>
        <div className="flex flex-wrap gap-4 mt-4">
          <Switch label="Notifications" checked={switched} onChange={setSwitched} />
          <Switch label="Disabled" checked disabled onChange={() => {}} />
        </div>
      </section>

      <section>
        <Typography variant="h3">SegmentedControl</Typography>
        <div className="mt-4">
          <SegmentedControl
            options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'done', label: 'Done' }]}
            value={segVal}
            onChange={setSegVal}
          />
        </div>
      </section>
    </div>
  );
}

function FeedbackSection({ showConfirm, setShowConfirm }: { showConfirm: boolean; setShowConfirm: (v: boolean) => void }) {
  return (
    <div className="space-y-8">
      <section>
        <Typography variant="h3">Alert</Typography>
        <div className="space-y-3 mt-4">
          <Alert type="info" title="Information" message="This is an informational alert." />
          <Alert type="success" title="Success" message="Operation completed successfully." />
          <Alert type="warning" title="Warning" message="Please review before proceeding." />
          <Alert type="error" title="Error" message="Something went wrong." dismissible onDismiss={() => {}} />
        </div>
      </section>

      <section>
        <Typography variant="h3">Banner</Typography>
        <div className="mt-4">
          <Banner type="info" title="Maintenance" message="Scheduled maintenance at 2 AM UTC." action={{ label: 'Learn more', onClick: () => {} }} />
        </div>
      </section>

      <section>
        <Typography variant="h3">Toast</Typography>
        <div className="space-y-2 mt-4 max-w-sm">
          <Toast type="success" title="Saved" message="Changes saved successfully" visible dismissible onDismiss={() => {}} />
          <Toast type="error" title="Failed" message="Could not save changes" visible dismissible onDismiss={() => {}} />
        </div>
      </section>

      <section>
        <Typography variant="h3">InlineMessage</Typography>
        <div className="space-y-2 mt-4">
          <InlineMessage type="info" message="This is informational" />
          <InlineMessage type="success" message="Successfully completed" />
          <InlineMessage type="warning" message="Proceed with caution" />
          <InlineMessage type="error" message="Required field" />
        </div>
      </section>

      <section>
        <Typography variant="h3">ConfirmationDialog</Typography>
        <div className="mt-4">
          <Button variant="danger" size="sm" onClick={() => setShowConfirm(true)}>Delete Item</Button>
          <ConfirmationDialog
            open={showConfirm}
            onClose={() => setShowConfirm(false)}
            onConfirm={() => setShowConfirm(false)}
            title="Delete Item"
            message="Are you sure you want to delete this item? This action cannot be undone."
            variant="danger"
          />
        </div>
      </section>

      <section>
        <Typography variant="h3">Notification</Typography>
        <div className="mt-4 max-w-sm">
          <Notification type="success" title="Release Created" message="Summer Nights has been created successfully" visible dismissible onDismiss={() => {}} />
        </div>
      </section>

      <section>
        <Typography variant="h3">Tags</Typography>
        <div className="flex flex-wrap gap-2 mt-4">
          <Tag label="Primary" color="primary" />
          <Tag label="Success" color="success" />
          <Tag label="Warning" color="warning" removable onRemove={() => {}} />
          <Tag label="Danger" color="danger" />
          <Tag label="Info" color="info" variant="outline" />
        </div>
      </section>
    </div>
  );
}

function DisplaySection() {
  return (
    <div className="space-y-8">
      <section>
        <Typography variant="h3">Badge & StatusBadge</Typography>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge label="Default" />
          <Badge label="Primary" color="bg-primary-50 text-primary-700" />
          <Badge label="Success" color="bg-success-50 text-success-500" size="md" />
          <StatusBadge status="completed" />
          <StatusBadge status="in_progress" />
          <StatusBadge status="blocked" />
          <StatusBadge status="released" />
        </div>
      </section>

      <section>
        <Typography variant="h3">ProgressBar & HealthBar</Typography>
        <div className="space-y-4 mt-4 max-w-md">
          <ProgressBar value={75} showLabel />
          <ProgressBar value={45} color="bg-warning-500" size="sm" showLabel />
          <ProgressBar value={100} color="bg-success-500" showLabel />
          <HealthBar value={78} />
          <HealthBar value={35} />
        </div>
      </section>

      <section>
        <Typography variant="h3">Typography</Typography>
        <div className="space-y-2 mt-4">
          <Typography variant="display">Display Text</Typography>
          <Typography variant="h1">Heading 1</Typography>
          <Typography variant="h2">Heading 2</Typography>
          <Typography variant="h3">Heading 3</Typography>
          <Typography variant="h4">Heading 4</Typography>
          <Typography variant="bodyLarge">Body Large</Typography>
          <Typography variant="body">Body - Default body text for paragraphs</Typography>
          <Typography variant="bodySmall">Body Small - Secondary information</Typography>
          <Typography variant="caption">Caption text for metadata</Typography>
          <Typography variant="label">LABEL</Typography>
          <Typography variant="overline">OVERLINE</Typography>
        </div>
      </section>

      <section>
        <Typography variant="h3">Divider</Typography>
        <div className="mt-4">
          <Divider />
          <div className="py-4" />
          <Divider label="OR" />
        </div>
      </section>

      <section>
        <Typography variant="h3">EmptyState & LoadingState</Typography>
        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          <Card>
            <EmptyState title="No items" description="No items have been added yet." action={{ label: 'Add Item', onClick: () => {} }} />
          </Card>
          <Card>
            <LoadingState text="Loading items..." />
          </Card>
        </div>
      </section>

      <section>
        <Typography variant="h3">Skeleton</Typography>
        <div className="space-y-4 mt-4 max-w-md">
          <Skeleton variant="text" count={3} />
          <Skeleton variant="card" />
          <Skeleton variant="table-row" count={2} />
        </div>
      </section>

      <section>
        <Typography variant="h3">Table</Typography>
        <div className="mt-4">
          <Table
            columns={[
              { key: 'name', header: 'Name', sortable: true },
              { key: 'status', header: 'Status' },
              { key: 'date', header: 'Date' },
            ]}
            data={[
              { id: '1', name: 'Item One', status: 'active', date: '2026-06-01' },
              { id: '2', name: 'Item Two', status: 'draft', date: '2026-06-15' },
              { id: '3', name: 'Item Three', status: 'completed', date: '2026-06-20' },
            ]}
          />
        </div>
      </section>
    </div>
  );
}

function DomainSection() {
  return (
    <div className="space-y-8">
      <section>
        <Typography variant="h3">ReleaseJourney</Typography>
        <Card padding="md" className="mt-4">
          <ReleaseJourney
            stages={[
              { id: '1', label: 'Planning', status: 'completed', date: 'Jan 5' },
              { id: '2', label: 'Recording', status: 'completed', date: 'Feb 12' },
              { id: '3', label: 'Editing', status: 'completed', date: 'Mar 15' },
              { id: '4', label: 'Mixing', status: 'current', date: 'Apr 1' },
              { id: '5', label: 'Mastering', status: 'pending' },
              { id: '6', label: 'Artwork', status: 'pending' },
              { id: '7', label: 'Publishing', status: 'pending' },
              { id: '8', label: 'Distribution', status: 'pending' },
              { id: '9', label: 'Released', status: 'pending' },
            ]}
          />
        </Card>
      </section>

      <section>
        <Typography variant="h3">HealthRing</Typography>
        <div className="flex flex-wrap gap-8 mt-4 items-start">
          <HealthRing size="lg" health={78} readiness={85} timelineConfidence={72} workflowCompletion={90} currentStage="Mixing" />
          <HealthRing size="md" health={78} readiness={85} timelineConfidence={72} workflowCompletion={90} />
          <HealthRing size="sm" health={78} readiness={85} timelineConfidence={72} workflowCompletion={90} />
        </div>
      </section>

      <section>
        <Typography variant="h3">ReadinessStack</Typography>
        <div className="max-w-md mt-4">
          <ReadinessStack
            categories={{
              Audio: { status: 'ready', description: 'Master recording approved' },
              Artwork: { status: 'ready', description: 'Front cover approved' },
              Metadata: { status: 'not-ready', description: 'UPC pending' },
              Rights: { status: 'not-ready', description: 'Publishing splits incomplete' },
              Distribution: { status: 'ready', description: 'Spotify + Apple Music configured' },
              Marketing: { status: 'not-ready', description: 'Press kit missing' },
              Legal: { status: 'ready', description: 'Contract signed' },
            }}
          />
        </div>
      </section>

      <section>
        <Typography variant="h3">WorkflowBoard</Typography>
        <div className="mt-4">
          <WorkflowBoard
            stages={[
              { id: '1', name: 'Recording', status: 'completed', owner: { name: 'Sarah Chen' }, progress: 100, dueDate: '2026-02-15' },
              { id: '2', name: 'Mixing', status: 'in-progress', owner: { name: 'Carlos Rivera' }, progress: 65, dueDate: '2026-06-01' },
              { id: '3', name: 'Artwork', status: 'at-risk', progress: 30, dueDate: '2026-05-20', dependencies: ['Mixing'], blockers: ['Waiting on photos'] },
              { id: '4', name: 'Distribution', status: 'pending', owner: { name: 'Annie Kim' }, progress: 0, dependencies: ['Artwork', 'Mixing'] },
            ]}
          />
        </div>
      </section>

      <section>
        <Typography variant="h3">OperationalSummary</Typography>
        <div className="mt-4">
          <OperationalSummary
            healthScore={78}
            currentStage="Mixing"
            completedStages={6}
            totalStages={9}
            readyItems={5}
            totalItems={7}
            pendingApprovals={2}
            blockers={1}
            daysUntilRelease={14}
          />
        </div>
      </section>
    </div>
  );
}
