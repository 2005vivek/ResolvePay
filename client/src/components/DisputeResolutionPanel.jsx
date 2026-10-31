import { useState } from 'react';
import axios from 'axios';

export default function DisputeResolutionPanel({ disputeId, paypalDisputeId, disputeStatus, onDisputeUpdated }) {
    const [draftContent, setDraftContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(null);

    const generateAiResponse = async () => {
        setIsLoading(true);
        setError(null);
        setSubmitSuccess(null);

        try {
            const response = await axios.post(
                `http://localhost:8080/api/disputes/${disputeId}/draft`,
                null,
                { responseType: 'text', timeout: 120000 }
            );
            setDraftContent(response.data);
        } catch (err) {
            console.error("AI Draft Error:", err);
            let message = 'Failed to generate AI draft.';
            if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                message = 'Draft generation timed out after 120 seconds. Please check backend connectivity and retry.';
            } else if (typeof err.response?.data === 'string' && err.response.data.trim()) {
                message = err.response.data;
            } else if (err.response?.data?.message) {
                message = err.response.data.message;
            } else if (err.message) {
                message = err.message;
            }
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const submitToPayPal = async () => {
        if (!draftContent.trim()) {
            setError("Cannot submit an empty draft. Please generate or enter a resolution message.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await axios.post(
                `http://localhost:8080/api/disputes/${disputeId}/submit`,
                { draftText: draftContent },
                { timeout: 120000 }
            );

            setSubmitSuccess({
                message: response.data?.message || 'Resolution draft successfully submitted to PayPal Dispute Center.',
                status: response.data?.status || 'UNDER_REVIEW',
                submittedAt: new Date().toLocaleTimeString()
            });

            if (onDisputeUpdated) {
                onDisputeUpdated();
            }
        } catch (err) {
            console.error("Submit to PayPal Error:", err);
            let message = 'Failed to submit draft to PayPal.';
            if (err.response?.data?.fieldErrors) {
                message = Object.values(err.response.data.fieldErrors).join(', ');
            } else if (err.response?.data?.details) {
                message = err.response.data.details;
            } else if (err.response?.data?.message) {
                message = err.response.data.message;
            } else if (typeof err.response?.data === 'string' && err.response.data.trim()) {
                message = err.response.data;
            } else if (err.response?.data?.error) {
                message = err.response.data.error;
            } else if (err.message) {
                message = err.message;
            }
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ textAlign: 'left', fontFamily: '"Arial", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '18px', fontFamily: '"Georgia", "Times New Roman", serif', fontWeight: 700 }}>
                        AI Resolution Assistant {paypalDisputeId ? `— Case ${paypalDisputeId}` : ''}
                    </h3>
                    {disputeStatus && (
                        <span style={{
                            display: 'inline-block',
                            marginTop: '6px',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: (submitSuccess?.status || disputeStatus) === 'REQUIRES_ACTION' ? '#fef3c7' : '#dbeafe',
                            color: (submitSuccess?.status || disputeStatus) === 'REQUIRES_ACTION' ? '#92400e' : '#1e40af'
                        }}>
                            Status: {submitSuccess?.status || disputeStatus}
                        </span>
                    )}
                </div>

                <button
                    onClick={generateAiResponse}
                    disabled={isLoading || isSubmitting}
                    style={{
                        backgroundColor: isLoading ? '#64748b' : '#0F2942',
                        color: '#ffffff',
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isLoading || isSubmitting ? 'not-allowed' : 'pointer',
                        fontWeight: '700',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        transition: 'opacity 0.2s'
                    }}
                >
                    {isLoading && (
                        <span style={{
                            width: '14px',
                            height: '14px',
                            border: '2px solid #ffffff',
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            display: 'inline-block',
                            animation: 'spin 1s linear infinite'
                        }} />
                    )}
                    {isLoading ? 'Generating Draft with Gemini...' : 'Generate Response with Gemini'}
                </button>
            </div>

            {/* Error Banner with Slide-in animation */}
            {error && (
                <div className="animate-top-slide" style={{
                    padding: '14px 16px',
                    backgroundColor: '#fef2f2',
                    color: '#991b1b',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                    <div>
                        <strong style={{ display: 'block', marginBottom: '4px', fontFamily: '"Georgia", "Times New Roman", serif', fontWeight: 700 }}>Request Error</strong>
                        <span style={{ fontSize: '13px' }}>{error}</span>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#991b1b',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            padding: '0 4px',
                            lineHeight: 1
                        }}
                        title="Dismiss"
                    >
                        &times;
                    </button>
                </div>
            )}

            {/* Success Banner with Top Slide-in animation */}
            {submitSuccess && (
                <div className="animate-top-slide" style={{
                    padding: '14px 16px',
                    backgroundColor: '#f0fdf4',
                    color: '#166534',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>&#10003;</span>
                        <strong style={{ fontSize: '14px', fontFamily: '"Georgia", "Times New Roman", serif', fontWeight: 700 }}>
                            Submitted to PayPal Dispute Center
                        </strong>
                    </div>
                    <p style={{ margin: '4px 0 0 24px', fontSize: '12px' }}>
                        {submitSuccess.message}
                    </p>
                    <p style={{ margin: '4px 0 0 24px', fontSize: '11px', color: '#15803d' }}>
                        Status updated to <strong>{submitSuccess.status}</strong> &bull; Recorded at {submitSuccess.submittedAt}
                    </p>
                </div>
            )}

            {draftContent && (
                <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label
                            htmlFor="draftArea"
                            style={{ fontWeight: '700', color: 'var(--text-h)', fontSize: '13px' }}
                        >
                            Review &amp; Edit Draft:
                        </label>
                        <span style={{ fontSize: '11px', color: 'var(--text)' }}>
                            {draftContent.length} characters &bull; {draftContent.trim().split(/\s+/).filter(Boolean).length} words
                        </span>
                    </div>

                    <textarea
                        id="draftArea"
                        value={draftContent}
                        onChange={(e) => {
                            setDraftContent(e.target.value);
                            if (submitSuccess) setSubmitSuccess(null);
                        }}
                        rows={14}
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--surface)',
                            color: 'var(--text-h)',
                            fontSize: '13px',
                            lineHeight: '1.6',
                            fontFamily: '"Arial", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            boxSizing: 'border-box',
                            resize: 'vertical',
                            outline: 'none',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)'
                        }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px', gap: '10px' }}>
                        <button
                            onClick={() => setDraftContent('')}
                            disabled={isSubmitting}
                            style={{
                                padding: '9px 18px',
                                border: '1px solid var(--border)',
                                borderRadius: '6px',
                                backgroundColor: 'transparent',
                                color: 'var(--text)',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                fontSize: '13px',
                                fontWeight: '600'
                            }}
                        >
                            Clear
                        </button>

                        <button
                            onClick={submitToPayPal}
                            disabled={isSubmitting || !draftContent.trim()}
                            style={{
                                backgroundColor: isSubmitting || !draftContent.trim() ? '#94a3b8' : '#047857',
                                color: '#ffffff',
                                padding: '9px 24px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: isSubmitting || !draftContent.trim() ? 'not-allowed' : 'pointer',
                                fontWeight: '700',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                        >
                            {isSubmitting && (
                                <span style={{
                                    width: '14px',
                                    height: '14px',
                                    border: '2px solid #ffffff',
                                    borderTop: '2px solid transparent',
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    animation: 'spin 1s linear infinite'
                                }} />
                            )}
                            {isSubmitting ? 'Submitting to PayPal...' : 'Submit to PayPal'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
