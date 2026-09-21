import React from 'react';
import { AuditLogsPanel } from '../../../components/cpanel/AuditLogsPanel';

export const CPanelLogsTab: React.FC = () => {
  return (
    <div id="view-cpanel-audit-logs">
      <AuditLogsPanel />
    </div>
  );
};
