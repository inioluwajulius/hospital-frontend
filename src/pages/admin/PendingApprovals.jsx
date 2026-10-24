import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UserCheck } from 'lucide-react';
import { PageHeader, StatusBadge } from '../staff/StaffUI';
import { getCurrentUser } from '../staff/staffUtils';
import ApplicationsPanel from '../../component/approvals/ApplicationsPanel';

/**
 * /admin/pending-approvals: doctors and nurses who registered for this hospital and
 * are waiting for an administrator's decision. The super admin sees all hospitals.
 * Notifications link here with ?application=<id> to open that application.
 */
const PendingApprovals = () => {
  const [searchParams] = useSearchParams();
  const [pendingCount, setPendingCount] = useState(null);
  const isSuperAdmin = getCurrentUser()?.role === 'super_admin';

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        icon={UserCheck}
        title="Pending Approvals"
        description={isSuperAdmin
          ? 'Doctor and nurse applications across all hospitals. Open a hospital to review only its applications.'
          : 'Doctors and nurses who registered for your hospital. They can log in once you approve them.'}
        action={pendingCount != null && (
          <StatusBadge tone={pendingCount ? 'amber' : 'green'}>{pendingCount} awaiting approval</StatusBadge>
        )}
      />
      <ApplicationsPanel showHospital={isSuperAdmin} highlightId={searchParams.get('application') || undefined} onCountChange={setPendingCount} />
    </div>
  );
};

export default PendingApprovals;
