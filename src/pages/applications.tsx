import React, { useState } from 'react';
import { Button, Empty, Skeleton, Tag } from 'antd';
import {
  BankOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useApplications } from '../hooks/useCandidatePortal';
import StatusTracker from '../components/applications/statusTracker';
import VacancyDetailsModal from '../components/applications/vacancyDetailsModal';
import type { VacancyDetail } from '../types/portal';

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

const statusToneClass = (status: string): string => {
  switch (status) {
    case 'Hired':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'Rejected':
      return 'bg-rose-50 text-rose-700 border-rose-100';
    case 'Testing':
    case 'Interviewing':
      return 'bg-blue-50 text-blue-700 border-blue-100';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-100';
  }
};

/**
 * "My Applications" page.
 *
 * Renders the FIFA-style pipeline tracker for every vacancy the
 * candidate has applied to. Reads from /candidate/portal/applications
 * (read-only). Each card shows the linked assessment if one exists,
 * with a "Take test" CTA whenever the candidate is currently at the
 * Testing stage.
 */
const ApplicationsPage: React.FC = () => {
  const { data, isLoading, isError } = useApplications();
  const navigate = useNavigate();
  const [detailVacancyId, setDetailVacancyId] = useState<string | null>(null);

  const pipeline = data?.pipeline ?? ['Applied', 'Testing', 'Interviewing', 'Hired'];
  const counts = data?.counts ?? { total: 0, in_progress: 0, completed: 0, rejected: 0 };

  const renderCard = (item: VacancyDetail) => {
    if (!item.application) return null;
    const status = item.application.status;
    const isTestingNow = status === 'Testing';
    const applied = formatDate(item.application.applied_at);

    return (
      <div
        key={item.application.candidate_id}
        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5 transition-shadow hover:shadow-lg"
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h3 className="text-lg font-black text-gray-900 truncate">{item.job_name}</h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 font-medium flex-wrap">
              {item.company_name && (
                <span className="flex items-center gap-1.5">
                  <BankOutlined /> {item.company_name}
                </span>
              )}
              {applied && <span>· Applied {applied}</span>}
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${statusToneClass(status)}`}
          >
            {status}
          </span>
        </div>

        <StatusTracker application={item.application} pipeline={pipeline} />

        {item.practice && (
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Linked assessment
                </p>
                <p className="font-bold text-gray-900 truncate">{item.practice.title}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <ClockCircleOutlined /> {item.practice.duration_minutes} min
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileTextOutlined /> {item.practice.question_count} questions
                  </span>
                  {item.practice.tags?.slice(0, 2).map((tag) => (
                    <Tag
                      key={tag}
                      className="rounded-full! border-0! bg-white! text-gray-600!"
                    >
                      {tag}
                    </Tag>
                  ))}
                </div>
              </div>
              {isTestingNow && (
                <Link to={`/test/${item.practice.practice_id}`}>
                  <Button type="primary" className="font-semibold">
                    Take test
                  </Button>
                </Link>
              )}
              {item.session_id && !isTestingNow && (
                <Button
                  onClick={() => navigate(`/reports/${item.session_id}`)}
                  className="font-semibold"
                >
                  View report
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setDetailVacancyId(item.id)}
            className="text-sm font-bold text-gray-600 hover:text-black flex items-center gap-1 cursor-pointer"
          >
            See full role <RightOutlined />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tighter text-gray-900 leading-none mb-3">
            My Applications
          </h2>
          <p className="text-gray-500 font-medium">
            Track every role you've applied to and see exactly where you stand in the
            pipeline — just like a FIFA progression bar.
          </p>
        </div>
        <Link to="/jobs">
          <Button type="primary" className="h-11 font-semibold rounded-xl!">
            Browse open roles
          </Button>
        </Link>
      </div>

      {/* Header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: counts.total, tone: 'bg-gray-50 text-gray-700' },
          { label: 'In Progress', value: counts.in_progress, tone: 'bg-blue-50 text-blue-700' },
          { label: 'Hired', value: counts.completed, tone: 'bg-emerald-50 text-emerald-700' },
          { label: 'Rejected', value: counts.rejected, tone: 'bg-rose-50 text-rose-700' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-3xl border border-gray-100 px-5 py-4 ${stat.tone}`}
          >
            <p className="text-[10px] font-black uppercase tracking-widest mb-1">
              {stat.label}
            </p>
            <p className="text-2xl font-black">{stat.value}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6"
            >
              <Skeleton active paragraph={{ rows: 4 }} />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-white rounded-3xl border border-rose-100 p-12 text-center text-rose-500">
          Couldn't load your applications. Try refreshing the page.
        </div>
      ) : (data?.items ?? []).length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16">
          <Empty description="You haven't applied to any roles yet. Browse open roles to get started." />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {(data?.items ?? []).map(renderCard)}
        </div>
      )}

      <VacancyDetailsModal
        vacancyId={detailVacancyId}
        open={Boolean(detailVacancyId)}
        onClose={() => setDetailVacancyId(null)}
        pipeline={pipeline}
      />
    </div>
  );
};

export default ApplicationsPage;
