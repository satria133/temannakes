import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { MONTH_LABELS } from "@/lib/constants";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica" },
  letterhead: { width: "100%", height: 70, marginBottom: 12, objectFit: "contain" },
  title: { fontSize: 12, fontWeight: 700, textAlign: "center" },
  subtitle: { fontSize: 10, textAlign: "center", marginBottom: 12 },
  infoRow: { flexDirection: "row", marginBottom: 2 },
  infoLabel: { width: 140 },
  infoColon: { width: 10 },
  infoValue: { flex: 1 },
  table: { marginTop: 12, borderWidth: 1, borderColor: "#000" },
  tr: { flexDirection: "row" },
  thActivity: {
    width: 180,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    padding: 3,
    fontWeight: 700,
    backgroundColor: "#e5e5e5",
  },
  th: {
    flex: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    padding: 3,
    textAlign: "center",
    fontWeight: 700,
    backgroundColor: "#e5e5e5",
  },
  tdActivity: {
    width: 180,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    padding: 3,
  },
  td: {
    flex: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    padding: 3,
    textAlign: "center",
  },
  signatureRow: { flexDirection: "row", marginTop: 40, justifyContent: "space-between" },
  signatureBlock: { width: "45%", textAlign: "center" },
  signatureSpace: { height: 50 },
  signatureName: { textDecoration: "underline", fontFamily: "Helvetica-Bold" },
  watermarkLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-around",
    alignItems: "center",
  },
  watermarkText: {
    fontSize: 56,
    fontFamily: "Helvetica-Bold",
    color: "#137f87",
    opacity: 0.18,
    transform: "rotate(-25deg)",
  },
});

export type PdfActivityRow = {
  label: string;
  quantitiesByMonth: number[]; // aligned with `months`
  total: number;
};

export type PdfData = {
  professionLabel: string;
  letterheadUrl?: string;
  institutionName: string;
  fullName: string;
  strNumber: string;
  sipNumber: string;
  sipValidUntil: string;
  position: string;
  periodLabel: string;
  months: { month: number; year: number }[];
  rows: PdfActivityRow[];
  columnTotals: number[];
  grandTotal: number;
  employeeNip?: string;
  supervisorName?: string;
  supervisorNip?: string;
  city?: string;
  issuedDateLabel: string;
  watermark?: string;
};

export function SubmissionPdfDocument({ data }: { data: PdfData }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {data.letterheadUrl && (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image src={data.letterheadUrl} style={styles.letterhead} />
        )}

        <Text style={styles.title}>
          REKAPITULASI KEGIATAN PRAKTIK PROFESI / PELAYANAN
        </Text>
        <Text style={styles.subtitle}>PROFESI : {data.professionLabel}</Text>

        <View>
          <Info label="Nama" value={data.fullName} />
          <Info label="No. STR" value={data.strNumber} />
          <Info label="No. SIP" value={data.sipNumber} />
          <Info label="SIP berlaku sampai" value={data.sipValidUntil} />
          <Info label="Jabatan" value={data.position} />
          <Info label="Periode Kegiatan" value={data.periodLabel} />
        </View>

        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={styles.thActivity}>Nama Kegiatan</Text>
            {data.months.map((m, i) => (
              <Text key={i} style={styles.th}>
                {MONTH_LABELS[m.month - 1].slice(0, 3).toUpperCase()}{"\n"}
                {m.year}
              </Text>
            ))}
            <Text style={styles.th}>TOTAL</Text>
          </View>
          {data.rows.map((row, i) => (
            <View key={i} style={styles.tr}>
              <Text style={styles.tdActivity}>{row.label}</Text>
              {row.quantitiesByMonth.map((q, j) => (
                <Text key={j} style={styles.td}>
                  {q}
                </Text>
              ))}
              <Text style={styles.td}>{row.total}</Text>
            </View>
          ))}
          <View style={styles.tr}>
            <Text style={[styles.tdActivity, { fontWeight: 700 }]}>TOTAL</Text>
            {data.columnTotals.map((t, i) => (
              <Text key={i} style={[styles.td, { fontWeight: 700 }]}>
                {t}
              </Text>
            ))}
            <Text style={[styles.td, { fontWeight: 700 }]}>
              {data.grandTotal}
            </Text>
          </View>
        </View>

        <View style={styles.signatureRow} wrap={false}>
          <View style={styles.signatureBlock}>
            <Text> </Text>
            <Text>Mengetahui</Text>
            <Text>PIMPINAN / ATASAN</Text>
            <Text>{data.institutionName}</Text>
            <View style={styles.signatureSpace} />
            <Text style={styles.signatureName}>
              {data.supervisorName ?? "____________________"}
            </Text>
            {data.supervisorNip && <Text>NIP. {data.supervisorNip}</Text>}
          </View>
          <View style={styles.signatureBlock}>
            <Text>
              {data.city ? `${data.city}, ` : ""}
              {data.issuedDateLabel}
            </Text>
            <Text>{data.professionLabel}</Text>
            <Text>{data.institutionName}</Text>
            <Text> </Text>
            <View style={styles.signatureSpace} />
            <Text style={styles.signatureName}>{data.fullName}</Text>
            {data.employeeNip && <Text>NIP. {data.employeeNip}</Text>}
          </View>
        </View>

        {data.watermark && (
          <View style={styles.watermarkLayer} fixed>
            {[0, 1, 2].map((i) => (
              <Text key={i} style={styles.watermarkText}>
                {data.watermark}
              </Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoColon}>:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}
