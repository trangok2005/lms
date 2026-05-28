import React, { useCallback, useState } from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { Text, Surface, Icon } from "react-native-paper";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import Styles, { colors } from "../../styles/Styles";
import { Header, ActionRow } from "../../components/common";

const AdminDashboardScreen = () => {
  const nav = useNavigation();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);


  const fetchOverview = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).get(endpoints["admin-transactions-stats"]);
      setOverview(res.data);
    } catch (ex) {
      console.debug("Overview API Error:", ex.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOverview();
    }, [])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Quản trị Hệ thống" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={Styles.p15}>
        
        <Text variant="titleMedium" style={styles.sectionTitle}>Tổng quan hệ thống</Text>
        
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
        ) : overview ? (
          <View style={[styles.statsGrid, Styles.mb15]}>
            <StatCard 
              icon="cash-multiple" 
              label="Tổng doanh thu" 
              value={`${Number(overview.total_revenue ?? overview.revenue ?? 0).toLocaleString("vi-VN")}₫`} 
              color={colors.primary} 
            />
            <StatCard 
              icon="receipt" 
              label="Tổng giao dịch" 
              value={String(overview.count ?? overview.total_count ?? 0)} 
              color="#F59E0B" 
            />
            <StatCard 
              icon="check-circle" 
              label="Đã thanh toán" 
              value={String(overview.success_count ?? overview.completed_count ?? overview.count ?? 0)} 
              color="#0066CC" 
            />
            <StatCard 
              icon="credit-card" 
              label="Phương thức phổ biến" 
              value={String(overview.top_method ?? "-").toUpperCase()} 
              color="#10B981" 
            />
          </View>
        ) : (
          <Text style={[styles.emptyText, Styles.mb15]}>Không thể tải dữ liệu tổng quan.</Text>
        )}

        <Text variant="titleMedium" style={styles.sectionTitle}>Chức năng quản lý</Text>
        <Surface style={styles.card} elevation={1}>
          <ActionRow 
            icon="format-list-bulleted" 
            label="Quản lý danh sách giao dịch" 
            onPress={() => nav.navigate("TransactionManagement")} 
          />
          <View style={styles.dividerLine} />
          <ActionRow 
            icon="chart-line" 
            label="Báo cáo & Xuất file doanh thu" 
            onPress={() => nav.navigate("Report")} 
          />
        </Surface>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};


const StatCard = ({ icon, label, value, color }) => (
  <Surface style={styles.statCard} elevation={1}>
    <Icon source={icon} size={26} color={color} />
    <Text variant="titleLarge" style={[styles.statValue, { color }]} numberOfLines={1}>
      {value}
    </Text>
    <Text variant="bodySmall" style={styles.statLabel}>{label}</Text>
  </Surface>
);

const styles = StyleSheet.create({
  sectionTitle: { fontWeight: "700", color: colors.black, marginBottom: 12, marginTop: 4 },
  card: { backgroundColor: colors.white, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 12 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  statCard: {
    width: "48%", backgroundColor: colors.white,
    borderRadius: 12, padding: 14, alignItems: "center", gap: 4, marginBottom: 10
  },
  statValue: { fontWeight: "800" },
  statLabel: { color: colors.gray, textAlign: "center", fontSize: 11 },
  dividerLine: { height: 1, backgroundColor: colors.bg, marginHorizontal: 8 },
  emptyText: { color: colors.gray, fontStyle: "italic", textAlign: "center" }
});

export default AdminDashboardScreen;