import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Phone, Inbox, MessageSquare, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { leadsApi } from '../../data/index.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import Badge from '../../components/common/Badge.jsx';
import Drawer from '../../components/common/Drawer.jsx';
import { FormField, Select } from '../../components/common/FormField.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { format } from 'date-fns';

const STATUS_TONES = {
  new: 'info',
  contacted: 'warning',
  converted: 'success',
  closed: 'neutral',
};

export default function LeadsList() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['leads'],
    queryFn: () => leadsApi.list(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => leadsApi.update(id, { status }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setSelected((s) => (s ? { ...s, status: res.data.status } : s));
      toast.success('Lead status updated');
    },
    onError: () => toast.error("Couldn't update lead status."),
  });

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email' },
    {
      key: 'source',
      header: 'Source',
      sortable: true,
      render: (row) => (
        <span className="capitalize">{row.source}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <Badge tone={STATUS_TONES[row.status] || 'neutral'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Received',
      sortable: true,
      render: (row) =>
        format(new Date(row.createdAt), 'MMM d, yyyy'),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Contact"
        subtitle="Submissions from the public Contact and Get a Quote forms."
      />

      <Card>
        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          isError={isError}
          searchPlaceholder="Search leads..."
          searchKeys={['name', 'email']}
          onRowClick={(row) => setSelected(row)}
          emptyState={
            <EmptyState
              icon={Inbox}
              title="No leads yet"
              message="Contact and quote submissions will show up here."
            />
          }
        />
      </Card>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
        subtitle={selected?.email}
        avatar={selected?.name?.[0]?.toUpperCase()}
      >
        {selected && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <Badge
                tone={STATUS_TONES[selected.status] || 'neutral'}
                className="capitalize"
              >
                {selected.status}
              </Badge>

              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <Calendar size={13} />
                {format(new Date(selected.createdAt), 'MMMM d, yyyy')}
              </span>
            </div>

            {/* Contact Info */}
            <div className="rounded-xl border p-4">
              <p className="mb-3 text-xs font-semibold uppercase">
                Contact information
              </p>

              <div className="space-y-2.5 text-sm">
                <a
                  href={`mailto:${selected.email}`}
                  className="flex items-center gap-2.5 hover:text-blue-500"
                >
                  <Mail size={14} />
                  {selected.email}
                </a>

                {selected.phone && (
                  <a
                    href={`tel:${selected.phone}`}
                    className="flex items-center gap-2.5 hover:text-blue-500"
                  >
                    <Phone size={14} />
                    {selected.phone}
                  </a>
                )}
              </div>
            </div>

            {/* Message */}
            <div className="rounded-xl border p-4">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase">
                <MessageSquare size={13} /> Message
              </p>

              <p className="whitespace-pre-wrap text-sm">
                {selected.message}
              </p>
            </div>

            {/* Status */}
            <FormField label="Lead status" htmlFor="lead-status">
              <Select
                id="lead-status"
                value={selected.status}
                onChange={(e) =>
                  statusMutation.mutate({
                    id: selected._id,
                    status: e.target.value,
                  })
                }
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="converted">Converted</option>
                <option value="closed">Closed</option>
              </Select>
            </FormField>
          </div>
        )}
      </Drawer>
    </div>
  );
}