import { useEffect, useState, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import axios from 'axios';
import {
    ModuleRegistry,
    ClientSideRowModelModule,
    ValidationModule,
    PaginationModule,
    RowSelectionModule
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import DisputeResolutionPanel from './components/DisputeResolutionPanel';

// Register all required AG Grid modules after imports
ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    ValidationModule,
    PaginationModule,
    RowSelectionModule
]);

function App() {
    const [rowData, setRowData] = useState([]);
    const [selectedDispute, setSelectedDispute] = useState(null);

    const [columnDefs] = useState([
        { field: 'paypalDisputeId', headerName: 'Dispute ID', flex: 1 },
        {
            field: 'status',
            headerName: 'Status',
            flex: 1,
            cellRenderer: (params) => {
                const status = params.value;
                const isAction = status === 'REQUIRES_ACTION';
                const isUnderReview = status === 'UNDER_REVIEW';
                const bg = isAction ? '#fef3c7' : isUnderReview ? '#dbeafe' : '#dcfce7';
                const color = isAction ? '#92400e' : isUnderReview ? '#1e40af' : '#166534';
                return (
                    <span style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: bg,
                        color: color
                    }}>
                        {status}
                    </span>
                );
            }
        },
        { field: 'reason', headerName: 'Reason', flex: 1.5 },
        { field: 'amount', headerName: 'Amount', flex: 1, valueFormatter: p => `$${p.value}` },
        { field: 'currency', headerName: 'Currency', flex: 1 }
    ]);

    const fetchDisputes = useCallback(() => {
        axios.get('http://localhost:8080/api/disputes')
            .then(response => {
                setRowData(response.data);
                if (response.data && response.data.length > 0) {
                    setSelectedDispute(prev => {
                        if (prev) {
                            const updated = response.data.find(d => d.id === prev.id);
                            return updated || response.data[0];
                        }
                        return response.data[0];
                    });
                }
            })
            .catch(error => {
                console.error("Error fetching disputes:", error);
            });
    }, []);

    useEffect(() => {
        fetchDisputes();
    }, [fetchDisputes]);

    return (
        <div style={{ padding: '24px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
                <h2 style={{ margin: '0 0 6px 0', color: '#111827', fontSize: '24px' }}>ResolvePay Dispute Dashboard</h2>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                    Automated PayPal dispute management and AI resolution agent
                </p>
            </div>

            <div className="ag-theme-alpine" style={{ height: 350, width: '100%', marginBottom: '24px' }}>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    pagination={true}
                    paginationPageSize={10}
                    paginationPageSizeSelector={[10, 20, 50, 100]}
                    theme="legacy"
                    rowSelection={{ mode: 'singleRow' }}
                    onRowClicked={(event) => setSelectedDispute(event.data)}
                    onSelectionChanged={(event) => {
                        const selectedRows = event.api.getSelectedRows();
                        if (selectedRows.length > 0) {
                            setSelectedDispute(selectedRows[0]);
                        }
                    }}
                />
            </div>

            {selectedDispute ? (
                <div style={{
                    padding: '24px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    color: '#1f2937',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                }}>
                    <DisputeResolutionPanel
                        key={selectedDispute.id}
                        disputeId={selectedDispute.id}
                        paypalDisputeId={selectedDispute.paypalDisputeId}
                        disputeStatus={selectedDispute.status}
                        onDisputeUpdated={fetchDisputes}
                    />
                </div>
            ) : (
                <p style={{ color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', padding: '32px 0' }}>
                    Click a dispute row in the table above to view details and generate an AI resolution draft.
                </p>
            )}
        </div>
    );
}

export default App;
