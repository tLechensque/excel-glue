import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Settings, CheckCircle2 } from 'lucide-react';
import { ExcelData } from '../ExcelConverter';

interface ColumnMappingStepProps {
  excelData: ExcelData;
  productSheet: string;
  imageSheet: string;
  onNext: (fieldMapping: Record<string, { sheet: string; column: string }>) => void;
  onBack: () => void;
}

const SYSTEM_FIELDS = [
  { 
    key: 'NOME', 
    label: 'Nome do Produto', 
    description: 'Nome/título do produto',
    required: true 
  },
  { 
    key: 'SKU', 
    label: 'SKU/Código', 
    description: 'Código único do produto',
    required: true 
  },
  { 
    key: 'PRECO_CUSTO', 
    label: 'Preço de Custo', 
    description: 'Valor de custo do produto',
    required: false 
  },
  { 
    key: 'PRECO_VENDA', 
    label: 'Preço de Venda', 
    description: 'Valor de venda do produto',
    required: false 
  },
  { 
    key: 'DESCRICAO_COMPLETA', 
    label: 'Descrição Completa', 
    description: 'Descrição detalhada do produto',
    required: false 
  },
  { 
    key: 'CATEGORIA', 
    label: 'Categoria', 
    description: 'Categoria/grupo do produto',
    required: false 
  },
  { 
    key: 'ESTOQUE', 
    label: 'Estoque', 
    description: 'Quantidade em estoque',
    required: false 
  },
  { 
    key: 'IMAGENS', 
    label: 'URLs das Imagens', 
    description: 'Links das imagens do produto',
    required: false 
  },
];

export const ColumnMappingStep: React.FC<ColumnMappingStepProps> = ({
  excelData,
  productSheet,
  imageSheet,
  onNext,
  onBack
}) => {
  const [fieldMapping, setFieldMapping] = useState<Record<string, { sheet: string; column: string }>>({});

  const getSheetColumns = (sheetName: string): string[] => {
    if (!sheetName || !excelData.data[sheetName]) return [];
    const firstRow = excelData.data[sheetName][0];
    return firstRow ? firstRow.filter(col => col !== null && col !== undefined && col !== '') : [];
  };

  const productColumns = getSheetColumns(productSheet);
  const imageColumns = getSheetColumns(imageSheet);
  const allColumns = {
    [productSheet]: productColumns,
    [imageSheet]: imageColumns,
  };

  const updateMapping = (fieldKey: string, sheet: string, column: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [fieldKey]: { sheet, column }
    }));
  };

  const clearMapping = (fieldKey: string) => {
    setFieldMapping(prev => {
      const newMapping = { ...prev };
      delete newMapping[fieldKey];
      return newMapping;
    });
  };

  const requiredFields = SYSTEM_FIELDS.filter(field => field.required);
  const mappedRequiredFields = requiredFields.filter(field => fieldMapping[field.key]);
  const canProceed = mappedRequiredFields.length === requiredFields.length;

  const handleNext = () => {
    onNext(fieldMapping);
  };

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <Settings className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Mapeamento de Colunas</h2>
        <p className="text-muted-foreground">
          Configure quais colunas correspondem a cada campo do sistema
        </p>
      </div>

      {/* Progress Info */}
      <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Campos obrigatórios mapeados: {mappedRequiredFields.length}/{requiredFields.length}
          </span>
          <Badge variant={canProceed ? "default" : "secondary"}>
            {canProceed ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Pronto
              </>
            ) : (
              `${requiredFields.length - mappedRequiredFields.length} restantes`
            )}
          </Badge>
        </div>
      </Card>

      <div className="space-y-6">
        {SYSTEM_FIELDS.map((field) => {
          const currentMapping = fieldMapping[field.key];
          const isMapped = !!currentMapping;

          return (
            <Card key={field.key} className={`p-6 transition-all ${
              field.required && !isMapped ? 'border-warning bg-warning/5' : 
              isMapped ? 'border-success bg-success/5' : ''
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{field.label}</h3>
                    {field.required && (
                      <Badge variant="destructive" className="text-xs">
                        Obrigatório
                      </Badge>
                    )}
                    {isMapped && (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Mapeado
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{field.description}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Aba de origem</Label>
                  <Select 
                    value={currentMapping?.sheet || ''} 
                    onValueChange={(sheet) => {
                      if (sheet && currentMapping?.column) {
                        updateMapping(field.key, sheet, currentMapping.column);
                      } else if (sheet) {
                        // Clear column when sheet changes
                        const newMapping = { ...currentMapping, sheet, column: '' };
                        setFieldMapping(prev => ({
                          ...prev,
                          [field.key]: newMapping
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a aba..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={productSheet}>
                        {productSheet} (Produtos)
                      </SelectItem>
                      <SelectItem value={imageSheet}>
                        {imageSheet} (Imagens)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Coluna</Label>
                  <Select
                    value={currentMapping?.column || ''}
                    onValueChange={(column) => {
                      if (column && currentMapping?.sheet) {
                        updateMapping(field.key, currentMapping.sheet, column);
                      }
                    }}
                    disabled={!currentMapping?.sheet}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a coluna..." />
                    </SelectTrigger>
                    <SelectContent>
                      {currentMapping?.sheet && allColumns[currentMapping.sheet]?.map((col, index) => (
                        <SelectItem key={index} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isMapped && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-success">
                    Mapeado: {currentMapping.sheet} → {currentMapping.column}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => clearMapping(field.key)}
                  >
                    Limpar
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        
        <Button 
          onClick={handleNext} 
          disabled={!canProceed}
          className="bg-gradient-primary"
        >
          Processar Arquivo
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};