import React from 'react';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import type { ApplicationStatus } from '../../types/portal';

interface StatusTrackerProps {
  /**
   * Application stage payload returned by the backend. The backend hands
   * the client the full pipeline and a `stage_index` rather than letting
   * the client guess so the two stay in sync.
   */
  application: ApplicationStatus;
  pipeline: string[];
}

/**
 * FIFA-style progression stepper. Each pipeline stage is a pill on a
 * single timeline — past stages are green (done), the current stage
 * pulses, future stages are muted. A "Rejected" outcome paints the
 * trailing edge red and shows a crossed-out final node so the user
 * can see how far they progressed before the decision.
 */
const StatusTracker: React.FC<StatusTrackerProps> = ({ application, pipeline }) => {
  const { stage_index: stageIndex, status, is_terminal: isTerminal } = application;
  const rejected = status === 'Rejected';
  const hired = status === 'Hired';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-1 mb-2">
        {pipeline.map((stage, idx) => {
          const isPast = idx < stageIndex;
          const isCurrent = idx === stageIndex && !isTerminal;
          const isFinalHired = hired && idx === pipeline.length - 1;
          const isRejectedHere = rejected && idx === stageIndex;

          const baseClass =
            'flex flex-col items-center justify-center text-center gap-1 flex-1 min-w-0';
          const dotBase =
            'size-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all';
          const dotState = isFinalHired
            ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30'
            : isRejectedHere
            ? 'bg-rose-500 border-rose-500 text-white'
            : isPast
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : isCurrent
            ? 'bg-white border-blue-500 text-blue-600 animate-pulse'
            : 'bg-gray-100 border-gray-200 text-gray-400';

          return (
            <React.Fragment key={stage}>
              <div className={baseClass}>
                <div className={`${dotBase} ${dotState}`}>
                  {isFinalHired ? (
                    <CheckCircleFilled />
                  ) : isRejectedHere ? (
                    <CloseCircleFilled />
                  ) : isPast ? (
                    <CheckCircleFilled />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest truncate ${
                    isFinalHired || isPast
                      ? 'text-emerald-600'
                      : isRejectedHere
                      ? 'text-rose-600'
                      : isCurrent
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }`}
                >
                  {stage}
                </span>
              </div>
              {idx < pipeline.length - 1 && (
                <div className="flex-1 h-0.5 -mt-5 mx-0.5 min-w-4">
                  <div
                    className={`h-full ${
                      idx < stageIndex
                        ? rejected
                          ? 'bg-rose-300'
                          : 'bg-emerald-400'
                        : 'bg-gray-200'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <p
        className={`text-xs font-bold text-center ${
          rejected
            ? 'text-rose-600'
            : hired
            ? 'text-emerald-600'
            : 'text-blue-600'
        }`}
      >
        {rejected
          ? 'Your application was not selected this time.'
          : hired
          ? "You're hired — congratulations!"
          : `You're at stage ${stageIndex + 1} of ${pipeline.length}: ${status}.`}
      </p>
    </div>
  );
};

export default StatusTracker;
