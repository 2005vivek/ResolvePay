import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TouchableOpacity, 
  SafeAreaView, StatusBar, Modal, ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import { Dispute } from './src/types';
import { fetchDisputes, submitDisputeResponse } from './src/api';

export default function App() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const data = await fetchDisputes();
    setDisputes(data);
    setLoading(false);
  }

  async function handleApprove(dispute: Dispute) {
    setSubmitting(true);
    try {
      await submitDisputeResponse(dispute.id, 'Approved and verified via ResolvePay Mobile App.');
      Alert.alert('Success', `Dispute ${dispute.paypalDisputeId} has been successfully submitted to PayPal!`);
      setSelectedDispute(null);
      loadData();
    } catch (e: any) {
      Alert.alert('Submission Error', e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const totalAtRisk = disputes.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070A10" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            Resolve<Text style={{ color: '#00CFDE' }}>Pay</Text>
          </Text>
          <Text style={styles.headerSubtitle}>Real-Time PayPal Dispute Defense</Text>
        </View>
        <TouchableOpacity style={styles.refreshBadge} onPress={loadData}>
          <Text style={styles.refreshText}>⟳ Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Emergency Alert Banner */}
      <View style={styles.alertCard}>
        <View style={styles.alertRow}>
          <Text style={styles.alertIcon}>🚨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>Total Value at Risk</Text>
            <Text style={styles.alertAmount}>${totalAtRisk.toFixed(2)} USD</Text>
          </View>
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>{disputes.length} CASES</Text>
          </View>
        </View>
      </View>

      {/* Dispute List */}
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>LIVE DISPUTE QUEUE</Text>

        {loading ? (
          <ActivityIndicator color="#00CFDE" size="large" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={disputes}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isUnderReview = item.status === 'UNDER_REVIEW';

              return (
                <TouchableOpacity 
                  style={styles.card}
                  onPress={() => setSelectedDispute(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.caseId}>{item.paypalDisputeId}</Text>
                    <View style={[
                      styles.statusBadge, 
                      isUnderReview ? styles.badgeBlue : styles.badgeRed
                    ]}>
                      <Text style={[
                        styles.statusText,
                        isUnderReview ? styles.textBlue : styles.textRed
                      ]}>
                        {isUnderReview ? 'UNDER REVIEW' : 'ACTION NEEDED'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.reasonText}>{item.reason}</Text>

                  <View style={styles.cardFooter}>
                    <Text style={styles.amountText}>
                      ${item.amount} {item.currency}
                    </Text>

                    <Text style={styles.countdownText}>
                      {isUnderReview ? 'Defended ✓' : '⏳ 23h left'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* Detail / Review Modal */}
      {selectedDispute && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedDispute(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Case Review</Text>
                <TouchableOpacity onPress={() => setSelectedDispute(null)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }}>
                <Text style={styles.detailLabel}>CASE ID:</Text>
                <Text style={styles.detailValue}>{selectedDispute.paypalDisputeId}</Text>

                <Text style={styles.detailLabel}>REASON:</Text>
                <Text style={styles.detailValue}>{selectedDispute.reason}</Text>

                <Text style={styles.detailLabel}>AMOUNT:</Text>
                <Text style={[styles.detailValue, { color: '#10B981', fontWeight: 'bold' }]}>
                  ${selectedDispute.amount} {selectedDispute.currency}
                </Text>

                <View style={styles.aiBox}>
                  <Text style={styles.aiBoxTitle}>✨ Gemini Multimodal Defense:</Text>
                  <Text style={styles.aiBoxBody}>
                    Carrier delivery confirmation with signature verified. Customer claim of non-delivery is disproven by postal timestamp records.
                  </Text>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.approveButton}
                disabled={submitting || selectedDispute.status === 'UNDER_REVIEW'}
                onPress={() => handleApprove(selectedDispute)}
              >
                {submitting ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.approveButtonText}>
                    {selectedDispute.status === 'UNDER_REVIEW' ? 'Already Submitted ✓' : 'One-Tap Approve & Submit'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A10',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  refreshBadge: {
    backgroundColor: '#131A2B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  refreshText: {
    color: '#00CFDE',
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertCard: {
    backgroundColor: '#0E1424',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 26,
    marginRight: 12,
  },
  alertTitle: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  alertAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
  },
  activePill: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activePillText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
  },
  listSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#0F1626',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caseId: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeRed: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  badgeBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  textRed: {
    color: '#F43F5E',
  },
  textBlue: {
    color: '#60A5FA',
  },
  reasonText: {
    color: '#D1D5DB',
    fontSize: 13,
    marginTop: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1A2333',
  },
  amountText: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 15,
  },
  countdownText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0E131F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeBtn: {
    color: '#9CA3AF',
    fontSize: 18,
    padding: 4,
  },
  detailLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: 'bold',
    marginTop: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#FFF',
    marginTop: 2,
  },
  aiBox: {
    backgroundColor: '#131B2E',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  aiBoxTitle: {
    color: '#00CFDE',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  aiBoxBody: {
    color: '#E5E7EB',
    fontSize: 12,
    lineHeight: 18,
  },
  approveButton: {
    backgroundColor: '#00CFDE',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  approveButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
