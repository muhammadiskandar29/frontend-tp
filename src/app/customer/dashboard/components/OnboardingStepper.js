"use client";

import "@/styles/customer/stepper.css";

export default function OnboardingStepper({
    currentStep = 1,
    steps = []
}) {
    return (
        <div className="onboarding-stepper">
            <div className="stepper-header">
                <h3>Proses Onboarding</h3>
                <p>Selesaikan langkah-langkah berikut untuk memulai pembelajaran Anda</p>
            </div>

            <div className="stepper-wrapper">
                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = stepNumber < currentStep || step.isCompleted;
                    const isActive = stepNumber === currentStep && !step.isCompleted;
                    const isLocked = stepNumber > currentStep;

                    let stateClass = "";
                    if (isCompleted) stateClass = "completed";
                    else if (isActive) stateClass = "active";
                    else stateClass = "locked";

                    return (
                        <div key={step.id} className={`stepper-item ${stateClass}`}>
                            <div className="step-circle">
                                {isCompleted ? (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                ) : (
                                    <span>{stepNumber}</span>
                                )}
                            </div>
                            <div className="step-content">
                                <h4>{step.title}</h4>
                                <p>{step.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
