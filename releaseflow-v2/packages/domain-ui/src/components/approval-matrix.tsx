interface ApprovalItem {
  id: string;
  category: string;
  status: 'approved' | 'pending' | 'rejected' | 'not-required';
  approver?: string;
  date?: string;
  comments?: string;
}

interface ApprovalMatrixProps {
  items: ApprovalItem[];
  className?: string;
}

const CheckMark = () => (
  <svg className="h-3 w-3 inline" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 6l2.5 2.5L10 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ClockIcon = () => (
  <svg className="h-3 w-3 inline" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="6" cy="6" r="4" />
    <path d="M6 3.5V6l1.5 1.5" strokeLinecap="round" />
  </svg>
);

const XMark = () => (
  <svg className="h-3 w-3 inline" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
  </svg>
);

function renderStatusBadge(status: ApprovalItem['status']) {
  switch (status) {
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1 bg-success-50 text-success-500 rounded-full px-3 py-1 text-xs font-medium">
          <CheckMark />
          Approved
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 bg-warning-50 text-warning-500 rounded-full px-3 py-1 text-xs font-medium">
          <ClockIcon />
          Pending
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 bg-danger-50 text-danger-500 rounded-full px-3 py-1 text-xs font-medium">
          <XMark />
          Rejected
        </span>
      );
    case 'not-required':
      return (
        <span className="inline-flex items-center gap-1 bg-surface-100 text-text-400 rounded-full px-3 py-1 text-xs">
          Not Required
        </span>
      );
  }
}

export function ApprovalMatrix({ items, className = '' }: ApprovalMatrixProps) {
  if (items.length === 0) return null;

  return (
    <div className={`rounded-xl border border-surface-200 bg-layer-2 overflow-hidden ${className}`}>
      <div role="table" aria-label="Approval Matrix">
        <div role="rowgroup" className="bg-surface-50 border-b border-surface-200">
          <div role="row" className="flex">
            <div role="columnheader" className="text-text-700 text-xs font-medium uppercase px-4 py-3 flex-1">Category</div>
            <div role="columnheader" className="text-text-700 text-xs font-medium uppercase px-4 py-3 w-32">Status</div>
            <div role="columnheader" className="text-text-700 text-xs font-medium uppercase px-4 py-3 w-36 hidden md:block">Approver</div>
            <div role="columnheader" className="text-text-700 text-xs font-medium uppercase px-4 py-3 w-28 hidden md:block">Date</div>
          </div>
        </div>
        <div role="rowgroup">
          {items.map((item) => (
            <div
              key={item.id}
              role="row"
              className="flex border-b border-surface-100 hover:bg-surface-50 transition-colors duration-200"
            >
              <div role="cell" className="px-4 py-3 flex-1 flex flex-col justify-center">
                <span className="text-sm font-medium text-text-900">{item.category}</span>
                {item.comments && (
                  <span className="text-xs text-text-500 italic mt-0.5">{item.comments}</span>
                )}
              </div>
              <div role="cell" className="px-4 py-3 w-32 flex items-center">
                {renderStatusBadge(item.status)}
              </div>
              <div role="cell" className="px-4 py-3 w-36 hidden md:flex items-center">
                {item.approver && <span className="text-sm text-text-700">{item.approver}</span>}
              </div>
              <div role="cell" className="px-4 py-3 w-28 hidden md:flex items-center">
                {item.date && <span className="text-xs text-text-400">{item.date}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
