import React, { useCallback, useState } from "react";
import { View, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Chip, Surface, Icon, Divider } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import Styles, { colors } from "../../styles/Styles";
import { Header, Loading } from "../../components/common";


const STATUS_CONFIG = {
  success: { label: "Thành công", color: colors.primary,   bg: "#E8F5F0", icon: "check-circle"   },
  pending: { label: "Đang xử lý", color: "#F59E0B",        bg: "#FFFBEB", icon: "clock-outline"  },
  failed:  { label: "Thất bại",   color: colors.danger,    bg: "#FFEBEE", icon: "close-circle"   },
};

const METHOD_CONFIG = {
  momo:  { label: "MoMo",  icon: "wallet",      color: "#A50064" },
  vnpay: { label: "VNPay", icon: "credit-card", color: "#0066CC" },
  free:  { label: "Miễn phí", icon: "gift",     color: colors.primary },
};

const STATUS_FILTERS = [
  { label: "Tất cả",     value: "" },
  { label: "Thành công", value: "success" },
  { label: "Đang xử lý", value: "pending" },
  { label: "Thất bại",   value: "failed" },
];

const TransactionHistoryScreen = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchTransactions = async (currentStatus) => {
    try {
      setLoading(true);
      const token  = await AsyncStorage.getItem("token");
      const params = {};
      if (currentStatus) params.status = currentStatus;

      const res  = await authApis(token).get(endpoints["transactions"], { params });
      console.log("res.data:", JSON.stringify(res.data))
      const data = res.data.results ?? res.data;
      setTransactions(Array.isArray(data) ? data : []);
    } catch (ex) {
      console.error("TransactionHistory error:", ex.response?.data ?? ex.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTransactions(statusFilter);
    }, [statusFilter])
  );


  const totalPaid = (transactions ?? [])
    .filter((t) => t.status === "success" && t.payment_method !== "free")
    .reduce((sum, t) => sum + parseFloat(t.amount ?? 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Lịch sử thanh toán" showBack />

      {/* Filter status */}
      <FlatList
        data={STATUS_FILTERS}
        horizontal
        keyExtractor={(i) => i.value}
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        renderItem={({ item }) => (
          <Chip
            selected={statusFilter === item.value}
            onPress={() => setStatusFilter(item.value)}
            style={[styles.chip, statusFilter === item.value && styles.chipActive]}
            textStyle={{ color: statusFilter === item.value ? colors.white : colors.gray, fontSize: 12 }}
          >
            {item.label}
          </Chip>
        )}
      />
      
      {loading ? <Loading text="Đang tải lịch sử..." /> : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            transactions.length > 0 ? (

              <Surface style={styles.summaryCard} elevation={1}>
                <View style={Styles.between}>
                  <Text variant="bodyMedium" style={{ color: colors.gray }}>
                    Tổng {(transactions ?? []).filter(t => t.status === 'success').length} giao dịch thành công
                  </Text>
                  <Text variant="titleMedium" style={{ color: colors.primary, fontWeight: "800" }}>
                    {totalPaid.toLocaleString("vi-VN")}₫
                  </Text>
                </View>
              </Surface>
            ) : null
          }
          ListEmptyComponent={
            <View style={[Styles.center, { marginTop: 60 }]}>
              <Icon source="receipt-text-outline" size={48} color={colors.border} />
              <Text variant="bodyLarge" style={{ color: colors.gray, marginTop: 12 }}>
                Chưa có giao dịch nào
              </Text>
            </View>
          }
          renderItem={({ item }) => <TransactionCard transaction={item} />}
        />
      )}
    </View>
  );
};


const TransactionCard = ({ transaction }) => {
  const st = STATUS_CONFIG[transaction.status]  ?? STATUS_CONFIG.pending;
  const mt = METHOD_CONFIG[transaction.payment_method] ?? METHOD_CONFIG.free;
  const isFree = transaction.payment_method === "free" || parseFloat(transaction.amount) === 0;

  return (
    <Surface style={styles.card} elevation={1}>
      {/* Header: tên khoá + status badge */}
      <View style={[Styles.between, Styles.mb10]}>
        <Text variant="titleSmall" style={styles.courseName} numberOfLines={2}>
          {transaction.course_name ?? "Khoá học"}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
          <Icon source={st.icon} size={13} color={st.color} />
          <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>

      <Divider style={Styles.mb10} />

      {/* Chi tiết */}
      <View style={[Styles.between, Styles.mb10]}>
        <View style={Styles.row}>
          <Icon source={mt.icon} size={16} color={mt.color} />
          <Text variant="bodySmall" style={{ marginLeft: 6, color: colors.gray }}>
            {mt.label}
          </Text>
        </View>
        <Text variant="titleSmall" style={{ fontWeight: "700", color: isFree ? colors.primary : colors.black }}>
          {isFree ? "Miễn phí" : `${Number(transaction.amount).toLocaleString("vi-VN")}₫`}
        </Text>
      </View>

      {/* Ngày */}
      <View style={Styles.row}>
        <Icon source="calendar-outline" size={13} color={colors.gray} />
        <Text variant="bodySmall" style={{ marginLeft: 4, color: colors.gray }}>
          {new Date(transaction.created_date).toLocaleString("vi-VN")}
        </Text>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  filterRow:   {
    paddingVertical: 10, paddingHorizontal: 15, flexGrow: 0,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  chip:        { marginRight: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  chipActive:  { backgroundColor: colors.primary, borderColor: colors.primary },
  list:        { padding: 15, paddingBottom: 30 },

  summaryCard: {
    backgroundColor: colors.white, borderRadius: 12,
    padding: 14, marginBottom: 12,
  },

  card:        {
    backgroundColor: colors.white, borderRadius: 12,
    padding: 14, marginBottom: 10,
  },
  courseName:  { flex: 1, fontWeight: "700", color: colors.black, marginRight: 8, lineHeight: 18 },
  statusBadge: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20, gap: 4,
  },
  statusText:  { fontSize: 11, fontWeight: "700" },
});

export default TransactionHistoryScreen;