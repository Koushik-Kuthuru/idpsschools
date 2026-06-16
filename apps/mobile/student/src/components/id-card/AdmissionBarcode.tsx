import Barcode from 'react-native-barcode-svg';
import { View, Text, StyleSheet } from 'react-native';

function normalizeAdmissionBarcodeValue(admissionNumber: string): string {
  return admissionNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export function AdmissionBarcode({
  admissionNumber,
  maxWidth = 280,
}: {
  admissionNumber: string;
  maxWidth?: number;
}) {
  const value = normalizeAdmissionBarcodeValue(admissionNumber);

  if (!value) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Barcode
        value={value}
        format="CODE128"
        singleBarWidth={2}
        maxWidth={maxWidth}
        height={56}
        lineColor="#0f172a"
        backgroundColor="#ffffff"
      />
      <Text style={styles.label}>{admissionNumber}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#144835',
  },
});
