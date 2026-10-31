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
                        fontSize: '11px',
                        fontWeight: '700',
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
        <div style={{ padding: '24px', fontFamily: '"Arial", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: '1200px', margin: '0 auto', textAlign: 'left' }}>
            <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h2 style={{ margin: 0, fontFamily: '"Georgia", "Times New Roman", serif', fontWeight: 700, fontSize: '24px', color: 'var(--text-h)' }}>
                        ResolvePay™ Dispute Defense
                    </h2>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', textTransform: 'uppercase' }}>
                        Executive Console
                    </span>
                </div>
                <p style={{ margin: 0, color: 'var(--text)', fontSize: '13px' }}>
                    Automated PayPal dispute management and Gemini AI resolution agent
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
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    boxShadow: 'var(--shadow)'
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
                <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    border: '1px dashed var(--border)',
                    borderRadius: '12px',
                    color: 'var(--text)'
                }}>
                    Select a dispute above to inspect case details and generate an AI resolution draft.
                </div>
            )}
        </div>
    );
}

export default App;
