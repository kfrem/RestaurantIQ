import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Upload, FileSpreadsheet, Check, AlertTriangle,
  Table2, ArrowRight, Download, Trash2,
} from "lucide-react";

type ImportType = "ingredients" | "suppliers" | "menu-items";

const IMPORT_TEMPLATES: Record<ImportType, { label: string; columns: string[]; description: string }> = {
  ingredients: {
    label: "Ingredients",
    columns: ["name", "unit", "currentPrice", "previousPrice", "category", "classification"],
    description: "Import ingredient items with pricing and classification",
  },
  suppliers: {
    label: "Suppliers",
    columns: ["name", "contactInfo", "category"],
    description: "Import supplier contact information",
  },
  "menu-items": {
    label: "Menu Items",
    columns: ["name", "category", "sellingPrice", "description"],
    description: "Import menu items with prices",
  },
};

export default function DataImport() {
  const { toast } = useToast();
  const [importType, setImportType] = useState<ImportType>("ingredients");
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState("");
  const [importResult, setImportResult] = useState<{ imported: number } | null>(null);

  const { data: restaurant } = useQuery<any>({ queryKey: ["/api/restaurants/current"] });
  const restaurantId = restaurant?.id || 1;

  const importMutation = useMutation({
    mutationFn: async (data: { type: ImportType; rows: any[] }) => {
      const endpoint = `/api/import/${data.type}`;
      const res = await apiRequest("POST", endpoint, { restaurantId, data: data.rows });
      return res.json();
    },
    onSuccess: (result) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items", restaurantId] });
      toast({ title: `Imported ${result.imported} ${IMPORT_TEMPLATES[importType].label.toLowerCase()}` });
    },
    onError: () => {
      toast({ title: "Import failed", description: "Check your data format and try again", variant: "destructive" });
    },
  });

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setImportResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          toast({ title: "Empty file", description: "No data rows found", variant: "destructive" });
          return;
        }
        const data = results.data as Record<string, string>[];
        const hdrs = results.meta.fields || Object.keys(data[0] || {});
        setParsedData(data);
        setHeaders(hdrs);

        const template = IMPORT_TEMPLATES[importType];
        const autoMap: Record<string, string> = {};
        for (const col of template.columns) {
          const match = hdrs.find((h) => h.toLowerCase().replace(/[_\s]/g, "") === col.toLowerCase().replace(/[_\s]/g, ""));
          if (match) autoMap[col] = match;
        }
        setColumnMapping(autoMap);
      },
      error: () => {
        toast({ title: "Parse error", description: "Could not read the file. Ensure it is a valid CSV.", variant: "destructive" });
      },
    });

    e.target.value = "";
  }, [importType, toast]);

  const getMappedData = () => {
    return parsedData.map((row) => {
      const mapped: Record<string, string> = {};
      for (const [targetCol, sourceCol] of Object.entries(columnMapping)) {
        if (sourceCol && row[sourceCol] !== undefined) {
          mapped[targetCol] = row[sourceCol];
        }
      }
      return mapped;
    }).filter((row) => Object.keys(row).length > 0);
  };

  const handleImport = () => {
    const mapped = getMappedData();
    if (mapped.length === 0) {
      toast({ title: "No data to import", description: "Map at least one column", variant: "destructive" });
      return;
    }
    importMutation.mutate({ type: importType, rows: mapped });
  };

  const downloadTemplate = () => {
    const template = IMPORT_TEMPLATES[importType];
    const csv = template.columns.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${importType}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearData = () => {
    setParsedData([]);
    setHeaders([]);
    setColumnMapping({});
    setFileName("");
    setImportResult(null);
  };

  const template = IMPORT_TEMPLATES[importType];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" data-testid="page-data-import">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Data Import</h1>
        <p className="text-sm text-muted-foreground mt-1">Import your existing data from CSV or Excel spreadsheets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Import Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Data Type</label>
              <Select value={importType} onValueChange={(v) => { setImportType(v as ImportType); clearData(); }}>
                <SelectTrigger data-testid="select-import-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingredients">Ingredients</SelectItem>
                  <SelectItem value="suppliers">Suppliers</SelectItem>
                  <SelectItem value="menu-items">Menu Items</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Expected Columns</label>
              <div className="flex flex-wrap gap-1">
                {template.columns.map((col) => (
                  <Badge key={col} variant="secondary" className="text-xs">{col}</Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Upload File</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  data-testid="input-file-upload"
                />
                <div className="border-2 border-dashed rounded-md p-6 text-center hover-elevate cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Drop CSV file here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports CSV and TSV formats</p>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={downloadTemplate} data-testid="button-download-template">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {fileName && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">{fileName}</CardTitle>
                  <Badge variant="secondary">{parsedData.length} rows</Badge>
                </div>
                <Button size="icon" variant="ghost" onClick={clearData}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
            </Card>
          )}

          {headers.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Column Mapping
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">Map your file columns to the expected fields</p>
                {template.columns.map((targetCol) => (
                  <div key={targetCol} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-32 shrink-0">{targetCol}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <Select
                      value={columnMapping[targetCol] || ""}
                      onValueChange={(v) => setColumnMapping({ ...columnMapping, [targetCol]: v })}
                    >
                      <SelectTrigger className="flex-1" data-testid={`select-map-${targetCol}`}>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-- Skip --</SelectItem>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {columnMapping[targetCol] && columnMapping[targetCol] !== "__none__" && (
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {parsedData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Table2 className="h-4 w-4" />
                  Preview (first 5 rows)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        {headers.slice(0, 6).map((h) => (
                          <th key={h} className="text-left p-2 border-b font-medium text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 5).map((row, i) => (
                        <tr key={i}>
                          {headers.slice(0, 6).map((h) => (
                            <td key={h} className="p-2 border-b border-border/50 truncate max-w-[150px]">{row[h]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.length > 5 && (
                  <p className="text-xs text-muted-foreground mt-2">...and {parsedData.length - 5} more rows</p>
                )}
              </CardContent>
            </Card>
          )}

          {parsedData.length > 0 && (
            <div className="flex items-center gap-3">
              <Button
                className="flex-1"
                data-testid="button-import"
                disabled={importMutation.isPending || Object.keys(columnMapping).filter((k) => columnMapping[k] && columnMapping[k] !== "__none__").length === 0}
                onClick={handleImport}
              >
                {importMutation.isPending ? "Importing..." : `Import ${parsedData.length} ${template.label}`}
              </Button>
            </div>
          )}

          {importResult && (
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <Check className="h-5 w-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Import Complete</p>
                  <p className="text-xs text-muted-foreground">Successfully imported {importResult.imported} {template.label.toLowerCase()}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!fileName && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-2">Upload a CSV file to get started</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Export your data from your existing restaurant software, POS system, or spreadsheet and upload it here.
                  The system will automatically map columns where possible.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
