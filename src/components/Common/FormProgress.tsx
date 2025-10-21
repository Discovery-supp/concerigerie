import React from 'react';
import { Check } from 'lucide-react';
import { FormStep } from '../../types';

interface FormProgressProps {
  steps: FormStep[];
  currentStep: number;
}

const FormProgress: React.FC<FormProgressProps> = ({ steps, currentStep }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  index < currentStep
                    ? 'bg-green-500 border-green-500 text-white'
                    : index === currentStep
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                }`}
              >
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium text-center max-w-24 ${
                  index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${
                  index < currentStep
                    ? 'bg-green-500'
                    : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default FormProgress;