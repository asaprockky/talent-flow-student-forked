import React, { useMemo, useState } from 'react';
import { Button, Empty, Input, Tag, message } from 'antd';
import {
  BankOutlined,
  BellFilled,
  CheckCircleFilled,
  EnvironmentOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import {
  useApplyToVacancy,
  useNotifications,
  useVacancies,
} from '../hooks/useCandidatePortal';
import { ApiError } from '../lib/api';
import type { NotificationItem, VacancyItem } from '../types/portal';
import VacancyDetailsModal from '../components/applications/vacancyDetailsModal';

const formatDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Open Roles page (U6).
 *
 * Two surfaces:
 *   1. A pinned status-change feed at the top of the page — every
 *      unread `status_change` notification (from the admin pipeline)
 *      gets surfaced here so a candidate sees "Your application is now
 *      in Interviewing" the next time they land on Open Roles. Reads
 *      from the existing /notifications endpoint, no new wiring.
 *   2. The vacancy grid, with a "View details" button that opens the
 *      shared VacancyDetailsModal (full description, dates, the
 *      assessment that will be assigned, and the FIFA-style pipeline
 *      tracker once they've applied).
 */
const JobsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError } = useVacancies(search);
  const notifications = useNotifications();
  const apply = useApplyToVacancy();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [detailVacancyId, setDetailVacancyId] = useState<string | null>(null);

  const statusChanges = useMemo<NotificationItem[]>(() => {
    const items = notifications.data?.items ?? [];
    return items
      .filter((item) => item.type === 'status_change' && !item.is_read)
      .slice(0, 3);
  }, [notifications.data?.items]);

  const handleApply = async (vacancy: VacancyItem) => {
    setPendingId(vacancy.id);
    try {
      await apply.mutateAsync(vacancy.id);
      message.success(`Applied to ${vacancy.job_name}.`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        message.info('You have already applied to this vacancy.');
      } else {
        message.error(error instanceof Error ? error.message : 'Could not submit your application.');
      }
    } finally {
      setPendingId(null);
    }
  };

  const items = data?.items ?? [];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tighter text-gray-900 leading-none mb-3">Open Roles</h2>
          <p className="text-gray-500 font-medium">Browse open vacancies and apply in one click.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/applications">
            <Button className="h-11 font-semibold rounded-xl!">My applications</Button>
          </Link>
          <Input
            allowClear
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Search roles"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 sm:min-w-70 rounded-xl!"
          />
        </div>
      </div>

      {statusChanges.length > 0 && (
        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <BellFilled className="text-blue-500" />
            <h3 className="font-bold text-blue-900">Application updates</h3>
          </div>
          <ul className="space-y-2 text-sm text-blue-900">
            {statusChanges.map((item, idx) => (
              <li key={item.id ?? `${item.created_at}-${idx}`} className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold leading-snug">{item.title}</p>
                  {item.message && (
                    <p className="text-blue-900/80 leading-snug">{item.message}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <Link
            to="/applications"
            className="inline-block mt-3 text-xs font-bold text-blue-700 hover:underline"
          >
            View all my applications →
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-44 rounded-3xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-white rounded-3xl border border-rose-100 p-12 text-center text-rose-500">
          Vacancies are unavailable right now.
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16">
          <Empty description={search ? 'No roles match your search.' : 'No open roles right now. Check back soon.'} />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((vacancy) => {
            const deadline = formatDate(vacancy.end_date);
            return (
              <div
                key={vacancy.id}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4 transition-shadow hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{vacancy.job_name}</h3>
                    {vacancy.company_name && (
                      <p className="text-sm text-gray-400 font-medium flex items-center gap-1.5 mt-1">
                        <BankOutlined /> {vacancy.company_name}
                      </p>
                    )}
                  </div>
                  {vacancy.tag && <Tag className="rounded-full! border-0! bg-gray-100! text-gray-600!">{vacancy.tag}</Tag>}
                </div>

                {vacancy.job_description && (
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{vacancy.job_description}</p>
                )}

                <div className="flex items-center justify-between gap-3 mt-auto pt-2">
                  {deadline ? (
                    <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                      <EnvironmentOutlined /> Closes {deadline}
                    </span>
                  ) : (
                    <span />
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setDetailVacancyId(vacancy.id)}
                      className="h-10 font-semibold"
                    >
                      View details
                    </Button>
                    {vacancy.has_applied ? (
                      <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5">
                        <CheckCircleFilled /> Applied
                      </span>
                    ) : (
                      <Button
                        type="primary"
                        onClick={() => handleApply(vacancy)}
                        loading={pendingId === vacancy.id}
                        className="h-10 font-semibold"
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <VacancyDetailsModal
        vacancyId={detailVacancyId}
        open={Boolean(detailVacancyId)}
        onClose={() => setDetailVacancyId(null)}
      />
    </div>
  );
};

export default JobsPage;
