import React from 'react'
import {
  getOnboardingCategoryIndex,
  useOnboardingStore,
} from '@/app/store/useOnboardingStore'

export const OnboardingTitlebar = () => {
  const { onboardingStep, totalOnboardingSteps } = useOnboardingStore()
  const progress = ((onboardingStep + 1) / totalOnboardingSteps) * 100

  return (
    <>
      {/* Step counter */}
      <div className="onboarding-step-counter">
        <span className="step-current">{onboardingStep + 1}</span>
        <span className="step-separator">/</span>
        <span className="step-total">{totalOnboardingSteps}</span>
      </div>

      {/* Progress bar */}
      <div className="onboarding-progress-container">
        <div
          className="onboarding-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>
      <style>{`
        .onboarding-step-counter {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          font-weight: 500;
          color: #888;
          z-index: 2;
          pointer-events: none;
        }
        .step-current {
          color: #fff;
          font-weight: 600;
        }
        .step-separator {
          color: #666;
          margin: 0 2px;
        }
        .step-total {
          color: #888;
        }
        .onboarding-progress-container {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 2px;
          background-color: rgba(255, 255, 255, 0.05);
          z-index: 2;
        }
        .onboarding-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #ffffff 0%, #d1d5db 100%);
          transition: width 0.3s ease;
        }
      `}</style>
    </>
  )
}
