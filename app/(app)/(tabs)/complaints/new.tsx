import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Animated, {
  FadeIn,
  LinearTransition,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';

import { Screen } from '@/components/layout/Screen';
import { StepIndicator } from '@/features/complaints/components/StepIndicator';
import { StepCategory } from '@/features/complaints/components/steps/StepCategory';
import { StepDetails } from '@/features/complaints/components/steps/StepDetails';
import { StepLocation } from '@/features/complaints/components/steps/StepLocation';
import { StepPhotos } from '@/features/complaints/components/steps/StepPhotos';
import { StepReview } from '@/features/complaints/components/steps/StepReview';

export default function NewComplaintScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);

  const next = () => {
    setDirection(1);
    setStep((current) => Math.min(current + 1, 5));
  };

  const back = () => {
    setDirection(-1);
    setStep((current) => Math.max(current - 1, 1));
  };

  const startFreshComplaint = () => {
    setDirection(-1);
    setStep(1);
  };

  return (
    <Screen subtitle={t('complaints.newSubtitle')} title={t('complaints.newTitle')}>
      <Animated.View entering={FadeIn.duration(260)}>
        <StepIndicator current={step} />
      </Animated.View>

      <Animated.View
        key={step}
        entering={direction === 1 ? SlideInRight.duration(350) : SlideInLeft.duration(350)}
        exiting={direction === 1 ? SlideOutLeft.duration(250) : SlideOutRight.duration(250)}
        layout={LinearTransition.duration(200)}
      >
        {step === 1 ? <StepDetails onNext={next} /> : null}
        {step === 2 ? <StepCategory onBack={back} onNext={next} /> : null}
        {step === 3 ? <StepPhotos onBack={back} onNext={next} /> : null}
        {step === 4 ? <StepLocation onBack={back} onNext={next} /> : null}
        {step === 5 ? <StepReview onBack={back} onSubmissionSuccess={startFreshComplaint} /> : null}
      </Animated.View>
    </Screen>
  );
}
