import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Download, Mail, Phone, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import { applicationsApi } from '../../data/index.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Drawer from '../../components/common/Drawer.jsx';
import { FormField, Select } from '../../components/common/FormField.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { format } from 'date-fns';

const STATUS_TONES = {
  new: 'info',
  shortlisted: 'cta',
  interview: 'warning',
  hired: 'success',
  rejected: 'danger',
};

export default function Applications() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['job-applications'],
    queryFn: () => applicationsApi.list(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => applicationsApi.update(id, { status }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      setSelected((s) => (s ? { ...s, status: res.data.status } : s));
      toast.success('Application status updated');
    },
    onError: () => toast.error("Couldn't update status."),
  });

  const columns = [
    { key: 'applicantName', header: 'Applicant', sortable: true },
    { key: 'job', header: 'Applied for', render: (row) => row.job?.title || '—' },
    { key: 'email', header: 'Email' },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <Badge tone={STATUS_TONES[row.status] || 'neutral'}>{row.status}</Badge>,
    },
    {
      key: 'createdAt',
      header: 'Applied',
      sortable: true,
      render: (row) => format(new Date(row.createdAt), 'MMM d, yyyy'),
    },
  ];

  return (
    <div>
      <PageHeader title="Job Applications" subtitle="Review applicants for each open position." />

      <Card>
        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          isError={isError}
          searchPlaceholder="Search applicants..."
          searchKeys={['applicantName', 'email']}
          onRowClick={(row) => setSelected(row)}
          emptyState={<EmptyState icon={Inbox} title="No applications yet" message="Applications will appear here as candidates apply." />}
        />
      </Card>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.applicantName}
        footer={
          selected && (
            <a href={selected.resumeUrl} target="_blank" rel="noreferrer" className="block">
              <Button variant="secondary" className="w-full">
                <Download size={15} /> Download resume
              </Button>
            </a>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-body/60 dark:text-body-dark/60">
                Applied for
              </p>
              <p className="mt-1 text-sm font-medium text-heading dark:text-heading-dark">{selected.job?.title}</p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-body dark:text-body-dark">
                <Mail size={14} /> {selected.email}
              </div>
              <div className="flex items-center gap-2 text-body dark:text-body-dark">
                <Phone size={14} /> {selected.phone}
              </div>
              <div className="flex items-center gap-2 text-body dark:text-body-dark">
                <FileText size={14} /> Resume on file
              </div>
            </div>

            <FormField label="Application status" htmlFor="app-status">
              <Select
                id="app-status"
                value={selected.status}
                onChange={(e) => statusMutation.mutate({ id: selected._id, status: e.target.value })}
              >
                <option value="new">New</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview">Interview</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </Select>
            </FormField>

            <p className="text-xs text-body/60 dark:text-body-dark/60">
              Applied on {format(new Date(selected.createdAt), 'MMMM d, yyyy')}
            </p>
          </div>
        )}
      </Drawer>
    </div>
  );
}
