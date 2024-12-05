'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Papa from 'papaparse';
import { ChevronFirstIcon, ChevronLastIcon, ChevronRightIcon } from 'lucide-react';

interface DataRow {
  [key: string]: string;
}

interface CSVFile {
  id: string;
  name: string;
  data: DataRow[];
  headers: string[];
  selectedRows: number[];
  currentPage: number;
  rowsPerPage: number;
}

export function DataImport() {
  const [csvFiles, setCsvFiles] = useState<CSVFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number | null; header: string; value: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [currentCallIndex, setCurrentCallIndex] = useState<number>(0);
  const [callNotes, setCallNotes] = useState('');
  const [interest, setInterest] = useState<'not_specified' | 'interested' | 'not_interested'>('not_specified');

  const activeFile = csvFiles.find(file => file.id === activeFileId);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const text = await file.text();
        
        // First detect the delimiter by checking first few lines
        const firstLines = text.split('\n').slice(0, 5).join('\n');
        const possibleDelimiters = [',', ';', '\t', '|'];
        let bestDelimiter = ',';
        let maxColumns = 0;

        for (const delimiter of possibleDelimiters) {
          const columns = firstLines.split('\n')[0].split(delimiter).length;
          if (columns > maxColumns) {
            maxColumns = columns;
            bestDelimiter = delimiter;
          }
        }

        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          delimiter: bestDelimiter,
          transformHeader: (header) => {
            // Clean up header names
            return header.trim().replace(/['"]/g, '');
          },
          transform: (value) => {
            // Clean up cell values
            return value.trim().replace(/['"]/g, '');
          },
          complete: (results) => {
            if (results.errors.length > 0) {
              const errorMessages = results.errors
                .map(err => `${err.message} (row: ${err.row || 'unknown'})`)
                .join('; ');
              console.error('Parse errors:', results.errors);
              setError(`Error parsing ${file.name}: ${errorMessages}`);
              return;
            }

            const parsedData = results.data as DataRow[];
            if (parsedData.length === 0) {
              setError(`No data found in ${file.name}`);
              return;
            }

            // Validate the data structure
            const firstRow = parsedData[0];
            if (!firstRow || Object.keys(firstRow).length <= 1) {
              setError(`Invalid CSV format in ${file.name}. Please check the file format and delimiter.`);
              return;
            }

            // Add required columns if they don't exist
            const existingHeaders = Object.keys(parsedData[0]);
            if (!existingHeaders.includes('call_status')) {
              parsedData.forEach(row => row['call_status'] = 'not_called');
            }
            if (!existingHeaders.includes('interest')) {
              parsedData.forEach(row => row['interest'] = 'not_specified');
            }
            if (!existingHeaders.includes('call_notes')) {
              parsedData.forEach(row => row['call_notes'] = '');
            }

            const newFile: CSVFile = {
              id: crypto.randomUUID(),
              name: file.name,
              data: parsedData,
              headers: Object.keys(parsedData[0]),
              selectedRows: [],
              currentPage: 1,
              rowsPerPage: 10
            };

            setCsvFiles(prev => [...prev, newFile]);
            setActiveFileId(newFile.id);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setError(`Error parsing ${file.name}: ${error.message}`);
          }
        });
      }
    } catch (err) {
      console.error('Error reading file:', err);
      setError('Error reading file: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setCsvFiles(prev => prev.filter(file => file.id !== fileId));
    if (activeFileId === fileId) {
      setActiveFileId(csvFiles.find(file => file.id !== fileId)?.id || null);
    }
  };

  const handleHeaderEdit = (header: string, value: string) => {
    if (!activeFile) return;

    setCsvFiles(prev => prev.map(file => {
      if (file.id !== activeFileId) return file;

      const newHeaders = [...file.headers];
      const index = newHeaders.indexOf(header);
      if (index !== -1) {
        newHeaders[index] = value;
        // Update all data rows with new header
        const newData = file.data.map(row => {
          const newRow = { ...row };
          newRow[value] = newRow[header];
          delete newRow[header];
          return newRow;
        });

        return { ...file, headers: newHeaders, data: newData };
      }
      return file;
    }));
    setEditingCell(null);
  };

  const handleCellEdit = (rowIndex: number | null, header: string, value: string) => {
    setEditingCell({ rowIndex, header, value });
  };

  const handleCellSave = () => {
    if (!editingCell || !activeFile) return;
    
    if (editingCell.rowIndex === null) {
      // Editing header
      handleHeaderEdit(editingCell.header, editingCell.value);
    } else {
      // Editing cell
      setCsvFiles(prev => prev.map(file => {
        if (file.id !== activeFileId) return file;

        const newData = [...file.data];
        newData[editingCell.rowIndex] = {
          ...newData[editingCell.rowIndex],
          [editingCell.header]: editingCell.value
        };
        return { ...file, data: newData };
      }));
    }
    setEditingCell(null);
  };

  const handleAddNewRow = () => {
    if (!activeFile) return;

    const newRow = activeFile.headers.reduce((acc, header) => {
      acc[header] = '';
      return acc;
    }, {} as DataRow);
    newRow['call_status'] = 'not_called';
    newRow['interest'] = 'not_specified';
    newRow['call_notes'] = '';
    
    setCsvFiles(prev => prev.map(file => {
      if (file.id !== activeFileId) return file;
      return { ...file, data: [...file.data, newRow] };
    }));
  };

  const handleRowSelect = (rowIndex: number) => {
    if (!activeFile) return;

    setCsvFiles(prev => prev.map(file => {
      if (file.id !== activeFileId) return file;

      const selectedRows = file.selectedRows.includes(rowIndex)
        ? file.selectedRows.filter(i => i !== rowIndex)
        : [...file.selectedRows, rowIndex];

      return { ...file, selectedRows };
    }));
  };

  const handleStartCalls = () => {
    if (!activeFile || activeFile.selectedRows.length === 0) return;
    setCurrentCallIndex(0);
    setCallNotes('');
    setInterest('not_specified');
    setShowCallDialog(true);
  };

  const handleEndCall = () => {
    // Save current call data
    if (!activeFile) return;

    setCsvFiles(prev => prev.map(file => {
      if (file.id !== activeFileId) return file;

      const newData = [...file.data];
      const rowIndex = activeFile.selectedRows[currentCallIndex];
      newData[rowIndex] = {
        ...newData[rowIndex],
        call_status: 'completed',
        interest: interest,
        call_notes: callNotes
      };
      return { ...file, data: newData };
    }));

    // Move to next call or close dialog
    if (currentCallIndex < activeFile.selectedRows.length - 1) {
      setCurrentCallIndex(prev => prev + 1);
      setCallNotes('');
      setInterest('not_specified');
    } else {
      setShowCallDialog(false);
      setCurrentCallIndex(0);
      setCallNotes('');
      setInterest('not_specified');
      setCsvFiles(prev => prev.map(file => {
        if (file.id !== activeFileId) return file;
        return { ...file, selectedRows: [] };
      }));
    }
  };

  const handleSkipCall = () => {
    if (!activeFile) return;

    if (currentCallIndex < activeFile.selectedRows.length - 1) {
      setCurrentCallIndex(prev => prev + 1);
      setCallNotes('');
      setInterest('not_specified');
    } else {
      setShowCallDialog(false);
      setCurrentCallIndex(0);
      setCallNotes('');
      setInterest('not_specified');
      setCsvFiles(prev => prev.map(file => {
        if (file.id !== activeFileId) return file;
        return { ...file, selectedRows: [] };
      }));
    }
  };

  const handleDeleteSelected = () => {
    if (!activeFile) return;

    setCsvFiles(prev => prev.map(file => {
      if (file.id !== activeFileId) return file;

      const newData = file.data.filter((_, index) => !file.selectedRows.includes(index));
      return { ...file, data: newData, selectedRows: [] };
    }));
    setShowDeleteDialog(false);
  };

  const handlePageChange = (fileId: string, newPage: number) => {
    setCsvFiles(prev => prev.map(file => {
      if (file.id !== fileId) return file;
      return { ...file, currentPage: newPage };
    }));
  };

  const handleRowsPerPageChange = (fileId: string, newRowsPerPage: number) => {
    setCsvFiles(prev => prev.map(file => {
      if (file.id !== fileId) return file;
      return { ...file, rowsPerPage: newRowsPerPage, currentPage: 1 };
    }));
  };

  const getPageData = (file: CSVFile, searchTerm: string) => {
    const filteredData = file.data.filter(row =>
      Object.values(row).some(value =>
        value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    const startIndex = (file.currentPage - 1) * file.rowsPerPage;
    const endIndex = startIndex + file.rowsPerPage;
    return {
      pageData: filteredData.slice(startIndex, endIndex),
      totalRows: filteredData.length,
      totalPages: Math.ceil(filteredData.length / file.rowsPerPage)
    };
  };

  const filteredData = activeFile?.data.filter(row =>
    Object.values(row).some(value =>
      value.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const getCurrentCallDetails = () => {
    if (!activeFile || activeFile.selectedRows.length === 0 || currentCallIndex >= activeFile.selectedRows.length) return null;
    const rowIndex = activeFile.selectedRows[currentCallIndex];
    return {
      ...activeFile.data[rowIndex],
      rowIndex: rowIndex + 1,
      remaining: activeFile.selectedRows.length - currentCallIndex - 1
    };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Data Import</h2>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => document.getElementById('csvInput')?.click()}
            className="flex items-center gap-2"
          >
            <Icon name="upload" className="h-4 w-4" />
            Upload CSV Files
          </Button>
          <input
            id="csvInput"
            type="file"
            accept=".csv"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {csvFiles.length > 0 ? (
        <Tabs value={activeFileId || undefined} onValueChange={setActiveFileId}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              {csvFiles.map(file => (
                <TabsTrigger key={file.id} value={file.id} className="flex items-center gap-2">
                  <span>{file.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(file.id);
                    }}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <Icon name="x" className="h-4 w-4" />
                  </button>
                </TabsTrigger>
              ))}
            </TabsList>
            {activeFile && (
              <div className="flex items-center gap-4">
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Button
                  onClick={handleAddNewRow}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Icon name="plus" className="h-4 w-4" />
                  Add Row
                </Button>
                {activeFile.selectedRows.length > 0 && (
                  <>
                    <Button
                      onClick={handleStartCalls}
                      variant="default"
                      className="flex items-center gap-2"
                    >
                      <Icon name="phone" className="h-4 w-4" />
                      Start Calls ({activeFile.selectedRows.length})
                    </Button>
                    <Button
                      onClick={() => setShowDeleteDialog(true)}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <Icon name="trash" className="h-4 w-4" />
                      Delete Selected ({activeFile.selectedRows.length})
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {csvFiles.map(file => {
            const { pageData, totalRows, totalPages } = getPageData(file, searchTerm);
            
            return (
              <TabsContent key={file.id} value={file.id}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Showing {((file.currentPage - 1) * file.rowsPerPage) + 1} to {Math.min(file.currentPage * file.rowsPerPage, totalRows)} of {totalRows} entries
                    </div>
                    <div className="flex items-center gap-4">
                      <Select
                        value={file.rowsPerPage.toString()}
                        onValueChange={(value) => handleRowsPerPageChange(file.id, parseInt(value))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[10, 25, 50, 100].map(size => (
                            <SelectItem key={size} value={size.toString()}>
                              {size} per page
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-2 text-left w-8">
                            <input
                              type="checkbox"
                              checked={file.selectedRows.length === pageData.length && pageData.length > 0}
                              onChange={() => {
                                if (file.selectedRows.length === pageData.length && pageData.length > 0) {
                                  setCsvFiles(prev => prev.map(f => {
                                    if (f.id !== file.id) return f;
                                    return { ...f, selectedRows: [] };
                                  }));
                                } else {
                                  const pageIndices = pageData.map((_, index) => 
                                    ((file.currentPage - 1) * file.rowsPerPage) + index
                                  );
                                  setCsvFiles(prev => prev.map(f => {
                                    if (f.id !== file.id) return f;
                                    return { ...f, selectedRows: [...new Set([...f.selectedRows, ...pageIndices])] };
                                  }));
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                          </th>
                          {file.headers.map((header) => (
                            <th
                              key={header}
                              className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              onClick={() => handleCellEdit(null, header, header)}
                            >
                              {editingCell?.rowIndex === null && editingCell?.header === header ? (
                                <Input
                                  value={editingCell.value}
                                  onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                  onBlur={handleCellSave}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCellSave();
                                    if (e.key === 'Escape') setEditingCell(null);
                                  }}
                                  autoFocus
                                  className="h-6 text-xs"
                                />
                              ) : (
                                <div className="cursor-pointer hover:bg-gray-100 p-1 rounded truncate max-w-[200px]" title={header}>
                                  {header}
                                </div>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pageData.map((row, index) => {
                          const rowIndex = ((file.currentPage - 1) * file.rowsPerPage) + index;
                          return (
                            <tr 
                              key={rowIndex}
                              className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${
                                file.selectedRows.includes(rowIndex) ? 'bg-blue-50' : ''
                              }`}
                            >
                              <td className="px-2 py-2">
                                <input
                                  type="checkbox"
                                  checked={file.selectedRows.includes(rowIndex)}
                                  onChange={() => handleRowSelect(rowIndex)}
                                  className="rounded border-gray-300"
                                />
                              </td>
                              {file.headers.map((header) => (
                                <td
                                  key={`${rowIndex}-${header}`}
                                  className="px-2 py-2 whitespace-nowrap text-xs text-gray-500 cursor-pointer hover:bg-gray-100"
                                  onClick={() => handleCellEdit(rowIndex, header, row[header])}
                                >
                                  {editingCell?.rowIndex === rowIndex && editingCell?.header === header ? (
                                    <Input
                                      value={editingCell.value}
                                      onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                      onBlur={handleCellSave}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCellSave();
                                        if (e.key === 'Escape') setEditingCell(null);
                                      }}
                                      autoFocus
                                      className="h-6 text-xs"
                                    />
                                  ) : (
                                    <div className={`truncate max-w-[200px] ${
                                      header === 'interest' 
                                        ? `font-medium ${
                                            row[header] === 'interested' 
                                              ? 'text-green-600' 
                                              : row[header] === 'not_interested' 
                                                ? 'text-red-600' 
                                                : 'text-gray-500'
                                          }`
                                        : ''
                                    }`} title={row[header]}>
                                      {row[header] || ''}
                                    </div>
                                  )}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(file.id, 1)}
                        disabled={file.currentPage === 1}
                      >
                        <ChevronFirstIcon className='h-4 w-4'/>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(file.id, file.currentPage - 1)}
                        disabled={file.currentPage === 1}
                      >
                        <Icon name="chevronLeft" className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-gray-500">
                        Page {file.currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(file.id, file.currentPage + 1)}
                        disabled={file.currentPage === totalPages}
                      >
                        <ChevronRightIcon className='h-4 w-4'/>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(file.id, totalPages)}
                        disabled={file.currentPage === totalPages}
                      >
                        <ChevronLastIcon className='h-4 w-4'/>
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 space-y-4 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
          <Icon name="fileSpreadsheet" className="h-12 w-12" />
          <div className="text-center">
            <p className="font-medium">No files imported yet</p>
            <p className="text-sm">Upload CSV files to view and analyze data</p>
          </div>
        </div>
      )}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Selected Rows</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete {activeFile?.selectedRows.length} selected rows? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSelected}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Call Details</DialogTitle>
          </DialogHeader>
          {getCurrentCallDetails() && (
            <div className="grid gap-4 py-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Row {getCurrentCallDetails()?.rowIndex} of {activeFile?.selectedRows.length}
                  {getCurrentCallDetails()?.remaining > 0 && (
                    <span> ({getCurrentCallDetails()?.remaining} remaining)</span>
                  )}
                </div>
                <div className="text-sm font-medium">
                  Current Status: {getCurrentCallDetails()?.call_status}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Interest Level</label>
                <Select
                  value={interest}
                  onValueChange={(value: any) => setInterest(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select interest level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">Not Specified</SelectItem>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="not_interested">Not Interested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Call Notes</label>
                <textarea
                  className="w-full h-32 px-3 py-2 text-sm border rounded-md"
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Enter call notes..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={handleSkipCall}>
                Skip
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setShowCallDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEndCall}>
                  {currentCallIndex === activeFile?.selectedRows.length - 1 ? 'Finish' : 'Next Call'}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
