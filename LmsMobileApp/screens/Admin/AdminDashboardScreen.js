import React, { useCallback, useState } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Surface, Icon, Divider } from "react-native-paper";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import Styles, { colors } from "../../styles/Styles";
import { Header, Loading, ActionRow } from "../../components/common";

const AdminDashboardScreen = () => {
  const nav = useNavigation();
  const [overview, setOverview] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetch = async () => {
        try {
          setLoading(true);
          const token = await AsyncStorage.getItem("token");
          const res   = await authApis(token).get(endpoints["admin-overview"]);
          setOverview(res.data);
        } catch (ex) {
          console.error(ex);
        } finally {
          setLoading(false);
        }
      };
      fetch();
    }, [])
  );

  if (loading) return <Loading text="Đang tải dashboard..." />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Admin Dashboard" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Doanh thu ── */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Doanh thu</Text>
          <Surface style={styles.revenueCard} elevation={2}>
            <Icon source="cash-multiple" size={32} color={colors.white} />
            <Text variant="bodyMedium" style={styles.revenueLabel}>Tổng doanh thu</Text>
            <Text variant="headlineMedium" style={styles.revenueValue}>
              {Number(overview?.revenue?.total ?? 0).toLocaleString("vi-VN")}₫
            </Text>
            <View style={[Styles.between, { width: "100%", marginTop: 12 }]}>
              <StatChip icon="check-circle" label="Thành công" value={overview?.transactions?.success ?? 0} color="#A7F3D0" />
              <StatChip icon="close-circle" label="Thất bại"   value={overview?.transactions?.failed  ?? 0} color="#FCA5A5" />
              <StatChip icon="swap-horizontal" label="Tổng GD" value={overview?.transactions?.total   ?? 0} color="#BAE6FD" />
            </View>
          </Surface>
        </View>

        {/* ── Thống kê nhanh ── */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Tổng quan</Text>
          <View style={styles.statsGrid}>
            <StatCard icon="account-group"  label="Tổng người dùng" value={overview?.users?.total    ?? 0} color={colors.secondary} />
            <StatCard icon="account-school" label="Học viên"         value={overview?.users?.student  ?? 0} color={colors.primary}   />
            <StatCard icon="teach"          label="Giảng viên"       value={overview?.users?.teacher  ?? 0} color="#F59E0B"           />
            <StatCard icon="book-multiple"  label="Khoá học"         value={overview?.courses?.total  ?? 0} color={colors.danger}    />
          </View>
        </View>

        {/* ── Báo cáo chi tiết ── */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Báo cáo</Text>
          <Surface style={styles.card} elevation={1}>
            <ActionRow icon="chart-line"        label="Doanh thu theo thời gian"
              onPress={() => nav.navigate("Report", { type: "revenue" })} />
            <ActionRow icon="credit-card-multiple" label="Phương thức thanh toán"
              onPress={() => nav.navigate("Report", { type: "payment-methods" })} />
            <ActionRow icon="account-group"     label="Phân loại người dùng"
              onPress={() => nav.navigate("Report", { type: "users" })} />
            <ActionRow icon="receipt-text"      label="Danh sách giao dịch"
              onPress={() => nav.navigate("TransactionManagement")} />
            <ActionRow icon="account-cog"       label="Quản lý người dùng"
              onPress={() => nav.navigate("UserManagement")} />
          </Surface>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

// ── Sub components ───────────────────────────────────────
const StatCard = ({ icon, label, value, color }) => (
  <Surface style={styles.statCard} elevation={1}>
    <Icon source={icon} size={28} color={color} />
    <Text variant="headlineSmall" style={[styles.statValue, { color }]}>{value}</Text>
    <Text variant="bodySmall" style={styles.statLabel}>{label}</Text>
  </Surface>
);

const StatChip = ({ icon, label, value, color }) => (
  <View style={[styles.statChip, { backgroundColor: color + "33" }]}>
    <Icon source={icon} size={14} color={color.replace("33", "")} />
    <Text style={{ fontSize: 11, color: colors.black, marginLeft: 4 }}>{label}: {value}</Text>
  </View>
);

const styles = StyleSheet.create({
  section:      { paddingHorizontal: 15, marginBottom: 16 },
  sectionTitle: { fontWeight: "700", color: colors.black, marginBottom: 10 },

  revenueCard:  {
    backgroundColor: colors.primary, borderRadius: 16,
    padding: 20, alignItems: "center",
  },
  revenueLabel: { color: "rgba(255,255,255,0.8)", marginTop: 8 },
  revenueValue: { color: colors.white, fontWeight: "800", marginTop: 4 },
  statChip:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },

  statsGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard:     {
    width: "47%", backgroundColor: colors.white,
    borderRadius: 12, padding: 16, alignItems: "center", gap: 6,
  },
  statValue:    { fontWeight: "800" },
  statLabel:    { color: colors.gray, textAlign: "center", fontSize: 12 },

  card:         { backgroundColor: colors.white, borderRadius: 12, padding: 16 },
});

export default AdminDashboardScreen;