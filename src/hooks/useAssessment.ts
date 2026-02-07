import { useState, useCallback } from 'react';
import { SkinAssessment } from '@/types/skincare';

const INITIAL_ASSESSMENT: SkinAssessment = {
  ageRange: '',
  gender: '',
  skinType: '',
  skinConcerns: [],
  climate: '',
  allergies: [],
  skinGoals: '',
  budgetRange: '',
};

export function useAssessment() {
  const [assessment, setAssessment] = useState<SkinAssessment>(INITIAL_ASSESSMENT);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  const updateAssessment = useCallback((field: keyof SkinAssessment, value: string | string[]) => {
    setAssessment(prev => ({ ...prev, [field]: value }));
  }, []);

  const toggleArrayField = useCallback((field: 'skinConcerns' | 'allergies', value: string) => {
    setAssessment(prev => {
      const current = prev[field];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  }, [totalSteps]);

  const resetAssessment = useCallback(() => {
    setAssessment(INITIAL_ASSESSMENT);
    setCurrentStep(1);
  }, []);

  const isStepValid = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        return !!assessment.ageRange;
      case 2:
        return !!assessment.skinType;
      case 3:
        return assessment.skinConcerns.length > 0;
      case 4:
        return !!assessment.climate;
      case 5:
        return !!assessment.budgetRange;
      case 6:
        return true; // Face photo is optional
      default:
        return false;
    }
  }, [assessment]);

  const canProceed = isStepValid(currentStep);

  return {
    assessment,
    currentStep,
    totalSteps,
    updateAssessment,
    toggleArrayField,
    nextStep,
    prevStep,
    goToStep,
    resetAssessment,
    canProceed,
    isStepValid,
  };
}
