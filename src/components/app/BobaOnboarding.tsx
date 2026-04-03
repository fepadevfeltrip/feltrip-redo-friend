import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Compass, CircleDot } from "lucide-react";
import cultAnalystImage from "@/assets/cult-character-analyst.png";
import { useTranslation } from "react-i18next";

interface BobaOnboardingProps {
  onComplete: () => void;
}

export const BobaOnboarding = ({ onComplete }: BobaOnboardingProps) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <CircleDot className="h-8 w-8 text-primary" />,
      title: t('onboarding.step1Title'),
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed">
            {t('onboarding.step1Content1')}
          </p>
          <p className="text-muted-foreground leading-relaxed mt-3">
            {t('onboarding.step1Content2')} <span className="text-primary font-medium">{t('onboarding.step1Content3')}</span> {t('onboarding.step1Content4')}
          </p>
          <p className="text-foreground font-medium mt-4">
            {t('onboarding.step1Content5')} <span className="text-primary">{t('onboarding.step1Content6')}</span>.
            {t('onboarding.step1Content7')}
          </p>
        </>
      ),
      cta: t('onboarding.step1Cta')
    },
    {
      icon: <Compass className="h-8 w-8 text-primary" />,
      title: t('onboarding.step2Title'),
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed">
            {t('onboarding.step2Content1')}
          </p>
          <p className="text-primary font-semibold mt-3 text-lg">
            {t('onboarding.step2Content2')}
          </p>
          <p className="text-muted-foreground leading-relaxed mt-3">
            {t('onboarding.step2Content3')}{" "}
            <span className="text-primary font-medium">{t('onboarding.step2Content4')}</span>{" "}
            {t('onboarding.step2Content5')}
          </p>
        </>
      ),
      cta: t('onboarding.step2Cta')
    },
    {
      icon: <Heart className="h-8 w-8 text-primary" />,
      title: t('onboarding.step3Title'),
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed">
            {t('onboarding.step3Content1')}{" "}
            <span className="text-primary font-medium">{t('onboarding.step3Content2')}</span>.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-3">
            {t('onboarding.step3Content3')}{" "}
            <span className="text-primary font-medium">{t('onboarding.step3Content4')}</span>{" "}
            {t('onboarding.step3Content5')}
          </p>
          <p className="text-foreground font-medium mt-4">
            {t('onboarding.step3Content6')}
          </p>
        </>
      ),
      cta: t('onboarding.step3Cta')
    }
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-primary/5 p-6">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6">
        {/* Boba Image */}
        <div className="relative">
          <img 
            src={cultAnalystImage} 
            alt="Boba" 
            className="w-28 h-28 object-contain animate-float"
          />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-2 bg-primary/20 rounded-full blur-sm" />
        </div>

        {/* Step Icon */}
        <div className="p-4 rounded-full bg-primary/10">
          {currentStep.icon}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground">
          {currentStep.title}
        </h2>

        {/* Content */}
        <div className="text-left">
          {currentStep.content}
        </div>

        {/* Progress Dots */}
        <div className="flex gap-2 pt-4">
          {steps.map((_, index) => (
            <div 
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <Button 
        onClick={handleNext}
        className="w-full h-14 text-lg font-semibold"
      >
        {currentStep.cta}
      </Button>
    </div>
  );
};
