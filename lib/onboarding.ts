/**
 * Onboarding utilities and flow management
 */

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  order: number;
}

export interface OnboardingProgress {
  currentStep: number;
  completedSteps: string[];
  totalSteps: number;
  progress: number;
  isComplete: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to M4ktaba',
    description: 'Get started with your account',
    completed: false,
    required: true,
    order: 1,
  },
  {
    id: 'profile',
    title: 'Complete Profile',
    description: 'Add your personal information',
    completed: false,
    required: true,
    order: 2,
  },
  {
    id: 'verification',
    title: 'Verify Account',
    description: 'Verify your email address',
    completed: false,
    required: true,
    order: 3,
  },
  {
    id: 'preferences',
    title: 'Set Preferences',
    description: 'Choose your reading preferences',
    completed: false,
    required: false,
    order: 4,
  },
  {
    id: 'tutorial',
    title: 'Take Tour',
    description: 'Learn how to use the platform',
    completed: false,
    required: false,
    order: 5,
  },
];

export class OnboardingManager {
  private steps: OnboardingStep[];
  private storageKey: string;

  constructor(storageKey: string = 'm4ktaba_onboarding') {
    this.storageKey = storageKey;
    this.steps = this.loadSteps();
  }

  private loadSteps(): OnboardingStep[] {
    if (typeof window === 'undefined') return ONBOARDING_STEPS;

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.steps || ONBOARDING_STEPS;
      }
    } catch (error) {
      console.error('Failed to load onboarding steps:', error);
    }

    return ONBOARDING_STEPS;
  }

  private saveSteps(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({ steps: this.steps })
      );
    } catch (error) {
      console.error('Failed to save onboarding steps:', error);
    }
  }

  getSteps(): OnboardingStep[] {
    return [...this.steps];
  }

  getStep(stepId: string): OnboardingStep | undefined {
    return this.steps.find(step => step.id === stepId);
  }

  completeStep(stepId: string): void {
    const step = this.getStep(stepId);
    if (step) {
      step.completed = true;
      this.saveSteps();
    }
  }

  uncompleteStep(stepId: string): void {
    const step = this.getStep(stepId);
    if (step) {
      step.completed = false;
      this.saveSteps();
    }
  }

  getProgress(): OnboardingProgress {
    const completedSteps = this.steps.filter(step => step.completed);
    const currentStep = this.steps.findIndex(step => !step.completed);
    const progress = (completedSteps.length / this.steps.length) * 100;

    return {
      currentStep: currentStep === -1 ? this.steps.length - 1 : currentStep,
      completedSteps: completedSteps.map(step => step.id),
      totalSteps: this.steps.length,
      progress: Math.round(progress),
      isComplete: completedSteps.length === this.steps.length,
    };
  }

  getNextStep(): OnboardingStep | undefined {
    const progress = this.getProgress();
    return this.steps[progress.currentStep];
  }

  getRequiredSteps(): OnboardingStep[] {
    return this.steps.filter(step => step.required);
  }

  getOptionalSteps(): OnboardingStep[] {
    return this.steps.filter(step => !step.required);
  }

  isStepCompleted(stepId: string): boolean {
    const step = this.getStep(stepId);
    return step?.completed || false;
  }

  canSkipStep(stepId: string): boolean {
    const step = this.getStep(stepId);
    return step ? !step.required : false;
  }

  reset(): void {
    this.steps = ONBOARDING_STEPS.map(step => ({ ...step, completed: false }));
    this.saveSteps();
  }

  skipToEnd(): void {
    this.steps.forEach(step => {
      step.completed = true;
    });
    this.saveSteps();
  }

  getCompletionRate(): number {
    const requiredSteps = this.getRequiredSteps();
    const completedRequired = requiredSteps.filter(step => step.completed);
    return (completedRequired.length / requiredSteps.length) * 100;
  }

  isOnboardingComplete(): boolean {
    const requiredSteps = this.getRequiredSteps();
    return requiredSteps.every(step => step.completed);
  }

  getIncompleteRequiredSteps(): OnboardingStep[] {
    return this.getRequiredSteps().filter(step => !step.completed);
  }

  getCompletionMessage(): string {
    const progress = this.getProgress();
    const requiredCompletion = this.getCompletionRate();

    if (progress.isComplete) {
      return "🎉 Congratulations! You've completed the onboarding process.";
    }

    if (requiredCompletion === 100) {
      return "✅ You've completed all required steps. Optional steps are available to enhance your experience.";
    }

    if (requiredCompletion >= 50) {
      return "🚀 Great progress! You're halfway through the required steps.";
    }

    return "👋 Welcome! Let's get you set up with your account.";
  }

  getStepStatus(
    stepId: string
  ): 'pending' | 'current' | 'completed' | 'skipped' {
    const step = this.getStep(stepId);
    if (!step) return 'pending';

    if (step.completed) return 'completed';

    const progress = this.getProgress();
    const stepIndex = this.steps.findIndex(s => s.id === stepId);

    if (stepIndex === progress.currentStep) return 'current';
    if (stepIndex < progress.currentStep) return 'skipped';

    return 'pending';
  }
}

// Singleton instance
export const onboardingManager = new OnboardingManager();

// Utility functions
export function useOnboarding() {
  return onboardingManager;
}

export function getOnboardingProgress(): OnboardingProgress {
  return onboardingManager.getProgress();
}

export function completeOnboardingStep(stepId: string): void {
  onboardingManager.completeStep(stepId);
}

export function isOnboardingComplete(): boolean {
  return onboardingManager.isOnboardingComplete();
}

export function getNextOnboardingStep(): OnboardingStep | undefined {
  return onboardingManager.getNextStep();
}

export function resetOnboarding(): void {
  onboardingManager.reset();
}

export function skipOnboarding(): void {
  onboardingManager.skipToEnd();
}

// Onboarding step definitions
export const ONBOARDING_STEP_DEFINITIONS = {
  welcome: {
    title: 'Welcome to M4ktaba',
    description: 'Your journey to discovering Islamic literature starts here',
    icon: 'BookOpen',
    estimatedTime: '2 minutes',
  },
  profile: {
    title: 'Complete Your Profile',
    description: 'Add your personal information to get started',
    icon: 'User',
    estimatedTime: '3 minutes',
  },
  verification: {
    title: 'Verify Your Account',
    description: 'Verify your email address for security',
    icon: 'Mail',
    estimatedTime: '1 minute',
  },
  preferences: {
    title: 'Set Your Preferences',
    description: 'Tell us about your reading interests',
    icon: 'Settings',
    estimatedTime: '2 minutes',
  },
  tutorial: {
    title: 'Take a Tour',
    description: 'Learn how to use the platform effectively',
    icon: 'Play',
    estimatedTime: '5 minutes',
  },
} as const;

export type OnboardingStepId = keyof typeof ONBOARDING_STEP_DEFINITIONS;
