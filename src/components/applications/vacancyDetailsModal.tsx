import React from 'react';
import { Modal, Button, Tag, Skeleton } from 'antd';
import {
  BankOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useApplyToVacancy, useVacancyDetail } from '../../hooks/useCandidatePortal';
import { ApiError } from '../../lib/api';
import { message } from 'antd';
import StatusTracker from './statusTracker';

interface VacancyDetailsModalProps {
  vacancyId: string | null;
  open: boolean;
  onClose: () => void;
  pipeline?: string[];
}

const DEFAULT_PIPELINE = ['Applied', 'Testing', 'Interviewing', 'Hired'];

const formatDate = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Full-screen vacancy details modal. Reads the backend's vacancy
 * detail payload to render:
 *   - full job description,
 *   - posting window,
 *   - the linked practice/test (if any) — duration, question count,
 *     a deep-link to the test if the user has been assigned it,
 *   - a FIFA-style pipeline tracker if the user has applied.
 *
 * The "Apply" CTA also lives here so the user can apply straight from
 * the detail view without going back to the listing.
 */
const VacancyDetailsModal: React.FC<VacancyDetailsModalProps> = ({
  vacancyId,
  open,
  onClose,
  pipeline,
}) => {
  const detail = useVacancyDetail(open ? vacancyId ?? undefined : undefined);
  const apply = useApplyToVacancy();
  const vacancy = detail.data;
  const effectivePipeline = pipeline ?? DEFAULT_PIPELINE;

  const handleApply = async () => {
    if (!vacancyId) return;
    try {
      await apply.mutateAsync(vacancyId);
      message.success(`Applied to ${vacancy?.job_name ?? 'this role'}.`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        message.info('You have already applied to this vacancy.');
      } else {
        message.error(
          error instanceof Error ? error.message : 'Could not submit your application.',
        );
      }
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={760}
      centered
      destroyOnHidden
      title={null}
    >
      {detail.isLoading || !vacancy ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-black text-gray-900 leading-tight mb-2">
                {vacancy.job_name}
              </h2>
              <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                {vacancy.company_name && (
                  <span className="flex items-center gap-1.5">
                    <BankOutlined /> {vacancy.company_name}
                  </span>
                )}
                {vacancy.tag && (
                  <Tag className="rounded-full! border-0! bg-gray-100! text-gray-700!">
                    {vacancy.tag}
                  </Tag>
                )}
                {!vacancy.is_open && (
                  <Tag className="rounded-full! border-0! bg-amber-50! text-amber-700!">
                    Closed
                  </Tag>
                )}
              </div>
            </div>
            {vacancy.application ? (
              <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5 shrink-0">
                <CheckCircleFilled /> Applied
              </span>
            ) : (
              vacancy.is_open && (
                <Button
                  type="primary"
                  onClick={handleApply}
                  loading={apply.isPending}
                  className="shrink-0 h-10 font-semibold"
                >
                  Apply now
                </Button>
              )
            )}
          </div>

          {/* Pipeline tracker. Only renders for vacancies the user has
              already applied to. */}
          {vacancy.application && (
            <div className="rounded-3xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-5">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                Your application
              </p>
              <StatusTracker
                application={vacancy.application}
                pipeline={effectivePipeline}
              />
            </div>
          )}

          {/* Posting window. */}
          <div className="grid sm:grid-cols-2 gap-3">
            {vacancy.start_date && (
              <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-700 flex items-center gap-2">
                <CalendarOutlined className="text-gray-400" />
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    Opens
                  </p>
                  <p className="font-semibold">{formatDate(vacancy.start_date)}</p>
                </div>
              </div>
            )}
            {vacancy.end_date && (
              <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-700 flex items-center gap-2">
                <CalendarOutlined className="text-gray-400" />
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    Closes
                  </p>
                  <p className="font-semibold">{formatDate(vacancy.end_date)}</p>
                </div>
              </div>
            )}
          </div>

          {vacancy.job_description && (
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                About this role
              </p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {vacancy.job_description}
              </p>
            </div>
          )}

          {/* Linked test (if any). Shows what the user will be asked to
              take if their application advances; if they're already at
              the Testing stage (i.e. the test was assigned), expose a
              "Take test" CTA that deep-links to the proctored test
              page. */}
          {vacancy.practice && (
            <div className="rounded-3xl border border-gray-100 p-5 bg-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                    Linked assessment
                  </p>
                  <h3 className="text-lg font-black text-gray-900">
                    {vacancy.practice.title}
                  </h3>
                </div>
                {vacancy.application?.status === 'Testing' && (
                  <Link to={`/test/${vacancy.practice.practice_id}`}>
                    <Button type="primary" className="font-semibold">
                      Take test
                    </Button>
                  </Link>
                )}
              </div>
              {vacancy.practice.description && (
                <p className="text-sm text-gray-600 leading-relaxed mt-3">
                  {vacancy.practice.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-gray-500 font-semibold">
                <span className="flex items-center gap-1.5">
                  <ClockCircleOutlined /> {vacancy.practice.duration_minutes} min
                </span>
                <span className="flex items-center gap-1.5">
                  <FileTextOutlined /> {vacancy.practice.question_count} questions
                </span>
                <span className="flex items-center gap-1.5">
                  <TeamOutlined /> {vacancy.practice.difficulty}
                </span>
                {vacancy.practice.tags?.slice(0, 4).map((tag) => (
                  <Tag
                    key={tag}
                    className="rounded-full! border-0! bg-gray-100! text-gray-600!"
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default VacancyDetailsModal;
