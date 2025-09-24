import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Download, CheckCircle2, Loader2, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ExcelData, MappingConfig } from '../ExcelConverter';
import * as XLSX from 'xlsx';

interface ProcessingStepProps {
  excelData: ExcelData;
  mappingConfig: MappingConfig;
  onBack: () => void;
}

interface ProcessingStatus {
  stage: 'preparing' | 'processing' | 'generating' | 'complete' | 'error';
  progress: number;
  message: string;
  processedRows?: number;
  totalRows?: number;
}

export const ProcessingStep: React.FC<ProcessingStepProps> = ({
  excelData,
  mappingConfig,
  onBack
}) => {
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: 'preparing',
    progress: 0,
    message: 'Preparando processamento...'
  });
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    processData();
  }, []);

  const processData = async () => {
    try {
      setStatus({
        stage: 'preparing',
        progress: 10,
        message: 'Carregando dados das abas...'
      });

      // Get data from sheets
      const productData = excelData.data[mappingConfig.productSheet];
      const imageData = excelData.data[mappingConfig.imageSheet];

      if (!productData || !imageData) {
        throw new Error('Dados das abas não encontrados');
      }

      setStatus({
        stage: 'processing',
        progress: 25,
        message: 'Processando produtos...',
        totalRows: productData.length - 1 // Exclude header
      });

      // Get headers
      const productHeaders = productData[0];
      const imageHeaders = imageData[0];

      // Find column indices for linking
      const productKeyIndex = productHeaders.findIndex((h: any) => h === mappingConfig.linkingKey.productColumn);
      const imageKeyIndex = imageHeaders.findIndex((h: any) => h === mappingConfig.linkingKey.imageColumn);

      if (productKeyIndex === -1 || imageKeyIndex === -1) {
        throw new Error('Colunas de chave de ligação não encontradas');
      }

      // Create image lookup map
      const imageMap = new Map<string, string[]>();
      for (let i = 1; i < imageData.length; i++) {
        const row = imageData[i];
        const key = String(row[imageKeyIndex] || '').trim();
        if (!key) continue;

        // Find image URL column
        const imageUrlMapping = Object.entries(mappingConfig.fieldMapping).find(
          ([field, mapping]) => field === 'IMAGENS' && mapping.sheet === mappingConfig.imageSheet
        );

        if (imageUrlMapping) {
          const imageUrlIndex = imageHeaders.findIndex((h: any) => h === imageUrlMapping[1].column);
          if (imageUrlIndex !== -1) {
            const imageUrl = String(row[imageUrlIndex] || '').trim();
            if (imageUrl) {
              if (!imageMap.has(key)) {
                imageMap.set(key, []);
              }
              imageMap.get(key)!.push(imageUrl);
            }
          }
        }
      }

      // Process products
      const processedData: any[][] = [];
      const outputHeaders: string[] = [];
      
      // Create headers from field mapping
      Object.entries(mappingConfig.fieldMapping).forEach(([field, mapping]) => {
        if (field !== 'IMAGENS') {
          outputHeaders.push(field);
        }
      });
      outputHeaders.push('IMAGENS'); // Always add IMAGENS at the end
      
      processedData.push(outputHeaders);

      for (let i = 1; i < productData.length; i++) {
        const productRow = productData[i];
        const productKey = String(productRow[productKeyIndex] || '').trim();

        if (!productKey) continue;

        const outputRow: any[] = [];
        
        // Map fields from configuration
        Object.entries(mappingConfig.fieldMapping).forEach(([field, mapping]) => {
          if (field === 'IMAGENS') return; // Handle separately
          
          let value = '';
          if (mapping.sheet === mappingConfig.productSheet) {
            const colIndex = productHeaders.findIndex((h: any) => h === mapping.column);
            if (colIndex !== -1) {
              value = productRow[colIndex] || '';
            }
          }
          // Note: For simplicity, we're primarily using product sheet data
          // In a more complex scenario, you might also pull from image sheet
          
          outputRow.push(value);
        });

        // Add images
        const images = imageMap.get(productKey) || [];
        outputRow.push(images.join(', '));

        processedData.push(outputRow);

        // Update progress
        const progress = 25 + (i / (productData.length - 1)) * 50;
        setStatus({
          stage: 'processing',
          progress,
          message: `Processando produto ${i} de ${productData.length - 1}...`,
          processedRows: i,
          totalRows: productData.length - 1
        });

        // Add small delay for UI updates
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      setStatus({
        stage: 'generating',
        progress: 80,
        message: 'Gerando arquivo Excel...'
      });

      // Create new workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(processedData);
      XLSX.utils.book_append_sheet(wb, ws, 'Produtos_Processados');

      // Generate file
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setStatus({
        stage: 'complete',
        progress: 100,
        message: `Processamento concluído! ${processedData.length - 1} produtos processados.`
      });

      toast({
        title: "Sucesso!",
        description: `Arquivo processado com ${processedData.length - 1} produtos.`,
      });

    } catch (error) {
      console.error('Processing error:', error);
      setStatus({
        stage: 'error',
        progress: 0,
        message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });

      toast({
        variant: "destructive",
        title: "Erro no processamento",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'produtos_processados.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const getStageIcon = () => {
    switch (status.stage) {
      case 'complete':
        return <CheckCircle2 className="w-8 h-8 text-success" />;
      case 'error':
        return <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground text-lg font-bold">!</div>;
      default:
        return <Loader2 className="w-8 h-8 text-primary animate-spin" />;
    }
  };

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <FileSpreadsheet className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Processamento do Arquivo</h2>
        <p className="text-muted-foreground">
          Convertendo dados para o formato padronizado
        </p>
      </div>

      {/* Status Card */}
      <Card className="p-8 text-center mb-8">
        <div className="flex flex-col items-center space-y-4">
          {getStageIcon()}
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">
              {status.stage === 'complete' ? 'Processamento Concluído!' :
               status.stage === 'error' ? 'Erro no Processamento' :
               'Processando Arquivo...'}
            </h3>
            <p className="text-muted-foreground">{status.message}</p>
            
            {status.processedRows !== undefined && status.totalRows && (
              <p className="text-sm text-muted-foreground">
                {status.processedRows} de {status.totalRows} produtos processados
              </p>
            )}
          </div>

          {status.stage !== 'complete' && status.stage !== 'error' && (
            <div className="w-full max-w-md">
              <Progress value={status.progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {Math.round(status.progress)}% concluído
              </p>
            </div>
          )}

          {status.stage === 'complete' && downloadUrl && (
            <Button 
              onClick={handleDownload} 
              className="bg-gradient-primary animate-glow"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar Arquivo Processado
            </Button>
          )}
        </div>
      </Card>

      {/* Configuration Summary */}
      <Card className="p-6 mb-8">
        <h3 className="font-medium mb-4">Configuração Aplicada</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Aba de Produtos:</span>
            <span>{mappingConfig.productSheet}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Aba de Imagens:</span>
            <span>{mappingConfig.imageSheet}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Chave de Ligação:</span>
            <span>{mappingConfig.linkingKey.productColumn} ↔ {mappingConfig.linkingKey.imageColumn}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Campos Mapeados:</span>
            <span>{Object.keys(mappingConfig.fieldMapping).length}</span>
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={status.stage === 'processing'}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        
        {status.stage === 'error' && (
          <Button onClick={processData} className="bg-gradient-primary">
            Tentar Novamente
          </Button>
        )}
      </div>
    </div>
  );
};