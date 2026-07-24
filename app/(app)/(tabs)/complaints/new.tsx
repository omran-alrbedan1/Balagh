import { useState } from 'react';

import { Screen } from '@/components/layout/Screen';
import { StepIndicator } from '@/features/complaints/components/StepIndicator';
import { StepCategory } from '@/features/complaints/components/steps/StepCategory';
import { StepDetails } from '@/features/complaints/components/steps/StepDetails';
import { StepLocation } from '@/features/complaints/components/steps/StepLocation';
import { StepPhotos } from '@/features/complaints/components/steps/StepPhotos';
import { StepReview } from '@/features/complaints/components/steps/StepReview';

export default function NewComplaintScreen() {
  const [step, setStep] = useState(1);
  const next = () => setStep((current) => Math.min(current + 1, 5));
  const back = () => setStep((current) => Math.max(current - 1, 1));

  return (
    <Screen subtitle="Submit the issue in a few guided steps." title="New Complaint">
      <StepIndicator current={step} />
      {step === 1 ? <StepCategory onNext={next} /> : null}
      {step === 2 ? <StepDetails onBack={back} onNext={next} /> : null}
      {step === 3 ? <StepPhotos onBack={back} onNext={next} /> : null}
      {step === 4 ? <StepLocation onBack={back} onNext={next} /> : null}
      {step === 5 ? <StepReview onBack={back} /> : null}
    </Screen>
  );
}
