import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { ExcelData } from '../ExcelConverter';

interface FileUploadStepProps {
  onFileUpload: (data: ExcelData) => void;
}

export const FileUploadStep: React.FC<FileUploadStepProps> = ({ onFileUpload }) => {
  const { toast } = useToast();

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        variant: "destructive",
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo Excel (.xlsx ou .xls)",
      });
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const sheets = workbook.SheetNames;
      const data: Record<string, any[]> = {};

      sheets.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        data[sheetName] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      });

      if (sheets.length === 0) {
        toast({
          variant: "destructive",
          title: "Arquivo vazio",
          description: "O arquivo não contém abas válidas",
        });
        return;
      }

      toast({
        title: "Arquivo carregado com sucesso!",
        description: `${sheets.length} aba(s) encontrada(s)`,
      });

      onFileUpload({ sheets, data });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao processar arquivo",
        description: "Não foi possível ler o arquivo Excel. Verifique se não está corrompido.",
      });
    }
  }, [onFileUpload, toast]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const input = document.createElement('input');
      input.type = 'file';
      input.files = event.dataTransfer.files;
      handleFileChange({ target: input } as any);
    }
  }, [handleFileChange]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <FileSpreadsheet className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Carregar Arquivo Excel</h2>
        <p className="text-muted-foreground">
          Faça o upload do arquivo Excel com múltiplas abas que deseja converter
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-border rounded-lg p-8 text-center transition-all hover:border-primary hover:bg-accent/20 cursor-pointer group"
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          
          <div>
            <p className="text-lg font-medium mb-2">
              Arraste e solte o arquivo aqui
            </p>
            <p className="text-muted-foreground mb-4">
              ou clique para selecionar
            </p>
            
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            
            <Button asChild variant="outline" className="mb-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                Selecionar Arquivo
              </label>
            </Button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <Card className="mt-6 p-4 bg-accent/20 border-accent">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-medium">Requisitos do arquivo:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Formato: .xlsx ou .xls</li>
              <li>• Deve conter pelo menos duas abas (produtos e imagens)</li>
              <li>• A primeira linha de cada aba deve conter os cabeçalhos das colunas</li>
              <li>• Tamanho máximo: 50MB</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};