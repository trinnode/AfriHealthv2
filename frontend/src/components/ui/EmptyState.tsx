/**
 * Empty State Component
 * Displays when lists or collections have no data
 */

import type { ReactNode, ReactElement } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
}: EmptyStateProps): ReactElement => {
  return (
    <div className="text-center py-12 px-4">
      {icon && (
        <div className="flex justify-center mb-4">
          {typeof icon === "string" ? (
            <span className="text-6xl">{icon}</span>
          ) : (
            icon
          )}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium inline-flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          {action.label}
        </button>
      )}
    </div>
  );
};

// Predefined empty states for common scenarios
export const EmptyRecords = ({
  onCreate,
}: {
  onCreate?: () => void;
}): ReactElement => (
  <EmptyState
    icon="📋"
    title="No medical records yet"
    description="Upload your first medical record to get started with secure health data management."
    action={
      onCreate ? { label: "Upload Record", onClick: onCreate } : undefined
    }
  />
);

export const EmptyInvoices = ({
  onCreate,
}: {
  onCreate?: () => void;
}): ReactElement => (
  <EmptyState
    icon="💰"
    title="No invoices found"
    description="You don't have any invoices yet. Create your first invoice to start billing."
    action={
      onCreate ? { label: "Create Invoice", onClick: onCreate } : undefined
    }
  />
);

export const EmptyClaims = ({
  onCreate,
}: {
  onCreate?: () => void;
}): ReactElement => (
  <EmptyState
    icon="🏥"
    title="No insurance claims"
    description="Submit your first insurance claim to get reimbursed for medical expenses."
    action={onCreate ? { label: "Submit Claim", onClick: onCreate } : undefined}
  />
);

export const EmptyConsents = ({
  onCreate,
}: {
  onCreate?: () => void;
}): ReactElement => (
  <EmptyState
    icon="🔐"
    title="No consent records"
    description="Grant or request access to medical records through consent management."
    action={
      onCreate ? { label: "Manage Consent", onClick: onCreate } : undefined
    }
  />
);

export const EmptySearch = (): ReactElement => (
  <EmptyState
    icon={
      <svg
        className="w-16 h-16 text-gray-400 mx-auto"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    }
    title="No results found"
    description="Try adjusting your search or filter criteria to find what you're looking for."
  />
);
