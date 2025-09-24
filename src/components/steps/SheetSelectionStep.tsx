import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Link, Table } from 'lucide-react';
import { ExcelData, MappingConfig } from '../ExcelConverter';

interface SheetSelectionStepProps {
  excelData: ExcelData;
  onNext: (config: Pick<MappingConfig, 'productSheet' | 'imageSheet' | 'linkingKey'>) => void;
  onBack: () => void;
}

export const SheetSelectionStep: React.FC<SheetSelectionStepProps> = ({
  excelData,
  onNext,
  onBack
}) => {
  const [productSheet, setProductSheet] = useState<string>('');
  const [imageSheet, setImageSheet] = useState<string>('');
  const [productColumn, setProductColumn] = useState<string>('');
  const [imageColumn, setImageColumn] = useState<string>('');

  const getSheetColumns = (sheetName: string): string[] => {
    if (!sheetName || !excelData.data[sheetName]) return [];
    const firstRow = excelData.data[sheetName][0];
    return firstRow ? firstRow.filter(col => col !== null && col !== undefined && col !== '') : [];
  };

  const getSheetPreview = (sheetName: string) => {
    if (!sheetName || !excelData.data[sheetName]) return { rows: 0, cols: 0 };
    const sheetData = excelData.data[sheetName];
    return {
      rows: sheetData.length,
      cols: sheetData[0]?.length || 0
    };
  };

  const canProceed = productSheet && imageSheet && productColumn && imageColumn;

  const handleNext = () => {
    if (canProceed) {
      onNext({
        productSheet,
        imageSheet,
        linkingKey: {
          productColumn,
          imageColumn
        }
      });
    }
  };

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <Table className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Configuração de Abas</h2>
        <p className="text-muted-foreground">
          Selecione as abas e configure a chave de ligação entre elas
        </p>
      </div>

      <div className="space-y-8">
        {/* Available Sheets */}
        <Card className="p-4">
          <h3 className="font-medium mb-3">Abas Disponíveis</h3>
          <div className="flex flex-wrap gap-2">
            {excelData.sheets.map(sheet => {
              const preview = getSheetPreview(sheet);
              return (
                <Badge key={sheet} variant="outline" className="px-3 py-2">
                  {sheet}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {preview.rows}×{preview.cols}
                  </span>
                </Badge>
              );
            })}
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Product Sheet Selection */}
          <Card className="p-6">
            <h3 className="font-medium mb-4 flex items-center">
              <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm mr-2">1</span>
              Aba Principal de Produtos
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="product-sheet">Selecione a aba de produtos</Label>
                <Select value={productSheet} onValueChange={setProductSheet}>
                  <SelectTrigger id="product-sheet">
                    <SelectValue placeholder="Escolha uma aba..." />
                  </SelectTrigger>
                  <SelectContent>
                    {excelData.sheets.map(sheet => (
                      <SelectItem key={sheet} value={sheet}>
                        {sheet}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {productSheet && (
                <div>
                  <Label htmlFor="product-column">Coluna chave do produto</Label>
                  <Select value={productColumn} onValueChange={setProductColumn}>
                    <SelectTrigger id="product-column">
                      <SelectValue placeholder="Escolha a coluna..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getSheetColumns(productSheet).map((col, index) => (
                        <SelectItem key={index} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </Card>

          {/* Image Sheet Selection */}
          <Card className="p-6">
            <h3 className="font-medium mb-4 flex items-center">
              <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm mr-2">2</span>
              Aba de Imagens
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="image-sheet">Selecione a aba de imagens</Label>
                <Select value={imageSheet} onValueChange={setImageSheet}>
                  <SelectTrigger id="image-sheet">
                    <SelectValue placeholder="Escolha uma aba..." />
                  </SelectTrigger>
                  <SelectContent>
                    {excelData.sheets.map(sheet => (
                      <SelectItem key={sheet} value={sheet}>
                        {sheet}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {imageSheet && (
                <div>
                  <Label htmlFor="image-column">Coluna de referência ao produto</Label>
                  <Select value={imageColumn} onValueChange={setImageColumn}>
                    <SelectTrigger id="image-column">
                      <SelectValue placeholder="Escolha a coluna..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getSheetColumns(imageSheet).map((col, index) => (
                        <SelectItem key={index} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Linking Configuration */}
        {productColumn && imageColumn && (
          <Card className="p-6 bg-primary/5 border-primary/20">
            <h3 className="font-medium mb-3 flex items-center text-primary">
              <Link className="w-5 h-5 mr-2" />
              Chave de Ligação Configurada
            </h3>
            <div className="bg-background/50 p-3 rounded-md">
              <p className="text-sm">
                <span className="font-medium">{productSheet}</span> → <span className="text-primary">{productColumn}</span>
                <span className="mx-2 text-muted-foreground">conecta com</span>
                <span className="font-medium">{imageSheet}</span> → <span className="text-primary">{imageColumn}</span>
              </p>
            </div>
          </Card>
        )}
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
          Continuar
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};