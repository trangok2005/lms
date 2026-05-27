import React, { useCallback, useState, useEffect } from "react";
import { View, ScrollView, FlatList, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { Text, Surface, Chip, Icon, Divider, Button } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Styles, { colors } from "../../styles/Styles";
import { Header, Loading } from "../../components/common";
import { endpoints, authApis } from "../../configs/Apis";

const STATUS_CONFIG = {
  success: { label: "Thành công", color: colors.primary, bg: "#E8F5F0", icon: "check-circle"  },
  pending: { label: "Đang xử lý", color: "#F59E0B",      bg: "#FFFBEB", icon: "clock-outline" },
  failed:  { label: "Thất bại",   color: colors.danger,  bg: "#FFEBEE", icon: "close-circle"  },
};

const METHOD_CONFIG = {
  momo:  { label: "MoMo",     color: "#A50064", icon: "wallet"      },
  vnpay: { label: "VNPay",    color: "#0066CC", icon: "credit-card" },
  free:  { label: "Miễn phí", color: colors.primary, icon: "gift"  },
};

const STATUS_FILTERS = [
  { label: "Tất cả trạng thái", value: "" },
  { label: "Thành công",         value: "success" },
  { label: "Đang xử lý",         value: "pending" },
  { label: "Thất bại",           value: "failed"  },
];

const METHOD_FILTERS = [
  { label: "Mọi phương thức", value: "" },
  { label: "Ví MoMo",         value: "momo"  },
  { label: "Cổng VNPay",      value: "vnpay" },
  { label: "Miễn phí (Free)", value: "free"  },
];

const TransactionManagementScreen = () => {
  const [statusF, setStatusF] = useState("");
  const [methodF, setMethodF] = useState("");

  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTransactions = async () => {
    if (page === 0) return;
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      
      const params = { page };
      if (statusF) params.status = statusF;
      if (methodF) params.method = methodF;

      // Gọi API: GET /admin/transactions/
      const res = await authApis(token).get(endpoints["admin-transactions"], { params });

      // Kiểm tra phân trang từ Django REST Framework
      if ((res.data.next ?? null) === null) {
        setPage(0);
      }

      const items = res.data.results ?? res.data ?? [];
      if (page === 1) {
        setTransactions(items);
      } else {
        // Khử trùng lặp bản ghi khi đắp thêm trang mới
        setTransactions(prev => {
          const uniqueItems = items.filter(newItem => !prev.some(oldItem => oldItem.id === newItem.id));
          return [...prev, ...uniqueItems];
        });
      }
    } catch (ex) {
      console.debug("Load transactions list failure:", ex.message);
    } finally {
      setLoading(false);
    }
  };

  // Kích hoạt nạp lại khi thay đổi bộ lọc hoặc chuyển trang
  useEffect(() => {
    loadTransactions();
  }, [page, statusF, methodF]);

  // Reset về trang 1 khi bấm đổi bộ lọc
  useEffect(() => { 
    setPage(1); 
  }, [statusF, methodF]);

  useFocusEffect(
    useCallback(() => { 
      setPage(1); 
    }, [])
  );

  const loadMore = () => { 
    if (page > 0 && !loading) setPage(prev => prev + 1); 
  };

  // Tính toán doanh thu nhanh của danh sách hiển thị
  const totalRevenue = transactions
    .filter((t) => t.status === "success" && (t.method ?? t.payment_method) !== "free")
    .reduce((sum, t) => sum + parseFloat(t.amount ?? t.total ?? 0), 0);

  const handleDelete = (id) => {
    Alert.alert("Xác nhận", "Hệ thống sẽ xóa vĩnh viễn giao dịch này?", [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa dữ liệu", style: "destructive", onPress: async () => {
        try {
          const token = await AsyncStorage.getItem("token");
          // Gọi API: DELETE /admin/transactions/{id}/
          await authApis(token).delete(endpoints["admin-transaction-detail"](id));
          setPage(1); // Tải lại danh sách
        } catch (ex) { 
          Alert.alert("Thất bại", ex.response?.data?.detail ?? "Không thể xóa giao dịch."); 
        }
      } }
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Quản lý giao dịch" showBack />

      {/* THANH BỘ LỌC CHIP FILTER */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {STATUS_FILTERS.map((item) => (
            <Chip 
              key={`status-${item.value}`} 
              selected={statusF === item.value} 
              onPress={() => setStatusF(item.value)}
              style={[styles.chip, statusF === item.value && styles.chipActive]}
              textStyle={{ color: statusF === item.value ? colors.white : colors.gray, fontSize: 12 }}>
              {item.label}
            </Chip>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filterRow, { borderTopWidth: 0 }]}>
          {METHOD_FILTERS.map((item) => (
            <Chip 
              key={`method-${item.value}`} 
              selected={methodF === item.value} 
              onPress={() => setMethodF(item.value)}
              style={[styles.chip, methodF === item.value && { backgroundColor: colors.secondary, borderColor: colors.secondary }]}
              textStyle={{ color: methodF === item.value ? colors.white : colors.gray, fontSize: 12 }}>
              {item.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* NỘI DUNG DANH SÁCH HÓA ĐƠN */}
      {loading && transactions.length === 0 ? (
        <Loading text="Đang đồng bộ giao dịch quản trị..." />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item, index) => `admin-tx-${item.id}-${index}`}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.2}
          ListFooterComponent={
            loading
              ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
              : page === 0 && transactions.length > 0
                ? <Text style={styles.endText}>Đã hiển thị toàn bộ hóa đơn</Text>
                : null
          }
          ListHeaderComponent={
            transactions.length > 0 ? (
              <Surface style={styles.summaryCard} elevation={1}>
                <View style={Styles.between}>
                  <View>
                    <Text variant="bodySmall" style={{ color: colors.gray }}>Dữ liệu hiển thị</Text>
                    <Text variant="titleSmall" style={{ color: colors.black, fontWeight: "700" }}>
                      {transactions.length} giao dịch
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text variant="bodySmall" style={{ color: colors.gray }}>Doanh thu trang hiện tại</Text>
                    <Text variant="titleSmall" style={{ color: colors.primary, fontWeight: "700" }}>
                      {totalRevenue.toLocaleString("vi-VN")}₫
                    </Text>
                  </View>
                </View>
              </Surface>
            ) : null
          }
          ListEmptyComponent={
            !loading && (
              <View style={[Styles.center, { marginTop: 60 }]}> 
                <Icon source="receipt-text-outline" size={48} color={colors.border} />
                <Text variant="bodyLarge" style={{ color: colors.gray, marginTop: 12 }}>
                  Không tìm thấy hóa đơn nào phù hợp.
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <TransactionCard transaction={item} onDelete={() => handleDelete(item.id)} />
          )}
        />
      )}
    </View>
  );
};

const TransactionCard = ({ transaction, onDelete }) => {
  const st = STATUS_CONFIG[transaction.status]            ?? STATUS_CONFIG.pending;
  const mt = METHOD_CONFIG[transaction.method ?? transaction.payment_method] ?? METHOD_CONFIG.free;
  const isFree = (transaction.method ?? transaction.payment_method) === "free" || parseFloat(transaction.amount ?? transaction.total ?? 0) === 0;

  return (
    <Surface style={styles.card} elevation={1}>
      <View style={[Styles.between, Styles.mb10]}>
        <Text variant="titleSmall" style={styles.courseName} numberOfLines={1}>
          {transaction.course_name ?? `Hóa đơn số #${transaction.id}`}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: st.bg }] }>
          <Icon source={st.icon} size={12} color={st.color} />
          <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>

      <Divider style={Styles.mb10} />

      {transaction.user && (
        <View style={[Styles.row, Styles.mb10]}>
          <Icon source="account-circle-outline" size={14} color={colors.gray} />
          <Text variant="bodySmall" style={{ marginLeft: 4, color: colors.gray, fontWeight: "600" }}>
            {transaction.user.first_name || transaction.user.last_name 
              ? `${transaction.user.first_name} ${transaction.user.last_name}` 
              : "Người dùng"} (@{transaction.user.username ?? "Khách"})
          </Text>
        </View>
      )}

      <View style={Styles.between}>
        <View style={Styles.row}>
          <Icon source={mt.icon} size={14} color={mt.color} />
          <Text variant="bodySmall" style={{ marginLeft: 5, color: colors.gray }}>{mt.label}</Text>
        </View>
        <Text variant="titleSmall" style={{ fontWeight: "800", color: isFree ? colors.primary : colors.black }}>
          {isFree ? "Miễn phí" : `${Number(transaction.amount ?? transaction.total ?? 0).toLocaleString("vi-VN")}₫`}
        </Text>
      </View>

      <View style={[Styles.row, { marginTop: 4, justifyContent: 'space-between', alignItems: 'center' }]}>
        <View style={Styles.row}>
          <Icon source="calendar-outline" size={12} color={colors.gray} />
          <Text variant="bodySmall" style={{ marginLeft: 4, color: colors.gray, fontSize: 11 }}>
            {transaction.created_at ?? transaction.created_date ?? transaction.date}
          </Text>
        </View>
        <Button mode="text" compact textColor={colors.danger} labelStyle={{ fontSize: 12, fontWeight: '700' }} onPress={onDelete}>Xóa đơn</Button>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  filterSection: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterRow:    { paddingVertical: 8, paddingHorizontal: 15, flexGrow: 0, backgroundColor: colors.white },
  chip:         { marginRight: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  chipActive:   { backgroundColor: colors.primary, borderColor: colors.primary },
  list:         { padding: 15, paddingBottom: 30 },
  summaryCard:  { backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 10 },
  card:         { backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 8 },
  courseName:   { flex: 1, fontWeight: "700", color: colors.black, marginRight: 8 },
  statusBadge:  { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, gap: 3 },
  statusText:   { fontSize: 11, fontWeight: "700" },
  endText:      { textAlign: 'center', color: colors.gray, fontSize: 11, marginVertical: 12, fontStyle: 'italic' }
});

export default TransactionManagementScreen;