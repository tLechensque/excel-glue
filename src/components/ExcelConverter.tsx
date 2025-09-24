import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileUploadStep } from './steps/FileUploadStep';
import { SheetSelectionStep } from './steps/SheetSelectionStep';
import { ColumnMappingStep } from './steps/ColumnMappingStep';
import { ProcessingStep } from './steps/ProcessingStep';
import { CheckCircle } from 'lucide-react';

export interface ExcelData {
  sheets: string[];
  data: Record<string, any[]>;
}

export interface MappingConfig {
  productSheet: string;
  imageSheet: string;
  linkingKey: {
    productColumn: string;
    imageColumn: string;
  };
  fieldMapping: Record<string, { sheet: string; column: string }>;
}

const STEPS = [
  { id: 1, title: 'Upload do Arquivo', description: 'Selecione o arquivo Excel' },
  { id: 2, title: 'Configuração de Abas', description: 'Escolha as abas e chave de ligação' },
  { id: 3, title: 'Mapeamento', description: 'Configure os campos de saída' },
  { id: 4, title: 'Processamento', description: 'Gere o arquivo convertido' }
];

export const ExcelConverter: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [mappingConfig, setMappingConfig] = useState<Partial<MappingConfig>>({});

  const handleFileUpload = (data: ExcelData) => {
    setExcelData(data);
    setCurrentStep(2);
  };

  const handleSheetSelection = (config: Pick<MappingConfig, 'productSheet' | 'imageSheet' | 'linkingKey'>) => {
    setMappingConfig(prev => ({ ...prev, ...config }));
    setCurrentStep(3);
  };

  const handleColumnMapping = (fieldMapping: Record<string, { sheet: string; column: string }>) => {
    setMappingConfig(prev => ({ ...prev, fieldMapping }));
    setCurrentStep(4);
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progressPercentage = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-bg p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Conversor Excel ERP
          </h1>
          <p className="text-muted-foreground text-lg">
            Transforme arquivos Excel complexos em formato padronizado
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8 p-6 glass-effect shadow-card">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm text-muted-foreground">{currentStep} de {STEPS.length}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between">
            {STEPS.map((step) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all ${
                  step.id < currentStep 
                    ? 'bg-success text-success-foreground' 
                    : step.id === currentStep
                    ? 'bg-primary text-primary-foreground animate-glow'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step.id < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="text-center">
                  <p className={`text-sm font-medium ${step.id === currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Step Content */}
        <Card className="glass-effect shadow-card animate-fade-in">
          {currentStep === 1 && (
            <FileUploadStep onFileUpload={handleFileUpload} />
          )}
          
          {currentStep === 2 && excelData && (
            <SheetSelectionStep 
              excelData={excelData}
              onNext={handleSheetSelection}
              onBack={handleBackStep}
            />
          )}
          
          {currentStep === 3 && excelData && mappingConfig.productSheet && mappingConfig.imageSheet && (
            <ColumnMappingStep
              excelData={excelData}
              productSheet={mappingConfig.productSheet}
              imageSheet={mappingConfig.imageSheet}
              onNext={handleColumnMapping}
              onBack={handleBackStep}
            />
          )}
          
          {currentStep === 4 && excelData && mappingConfig as MappingConfig && (
            <ProcessingStep
              excelData={excelData}
              mappingConfig={mappingConfig as MappingConfig}
              onBack={handleBackStep}
            />
          )}
        </Card>
      </div>
    </div>
  );
};