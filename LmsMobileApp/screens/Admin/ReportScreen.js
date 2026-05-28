import React, { useCallback, useState } from "react";
import { View, ScrollView, StyleSheet, Share, Dimensions, ActivityIndicator, Platform } from "react-native";
import { Text, Surface, Button, Divider } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BarChart, PieChart } from "react-native-chart-kit";

import DateTimePicker from "@react-native-community/datetimepicker";

import { authApis, endpoints } from "../../configs/Apis";
import Styles, { colors } from "../../styles/Styles";
import { Header } from "../../components/common";

const screenWidth = Dimensions.get("window").width;

const ReportScreen = () => {

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);


  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);


  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);


  const formatDateString = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };


  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const api = authApis(token);
      
      const params = {};
      if (fromDate) params.from = formatDateString(fromDate); 
      if (toDate) params.to = formatDateString(toDate);
      
      const res = await api.get(endpoints["admin-transactions-stats"], { params });
      setStats(res.data ?? null);
    } catch (ex) {
      console.debug("Lỗi tải stats:", ex.message);
    } finally {
      setLoading(false);
    }
  };


  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fromDate, toDate])
  );


  const onFromValueChange = (event, selectedDate) => {
    setShowFromPicker(false); // Đóng lịch ngay để tránh lặp sự kiện trùng lặp
    

    const actualDate = selectedDate || (event?.nativeEvent?.timestamp ? new Date(event.nativeEvent.timestamp) : null);
    
    if (actualDate) {
      setFromDate(actualDate);
    }
  };

  const onToValueChange = (event, selectedDate) => {
    setShowToPicker(false); // Đóng lịch ngay
    

    const actualDate = selectedDate || (event?.nativeEvent?.timestamp ? new Date(event.nativeEvent.timestamp) : null);
    
    if (actualDate) {
      setToDate(actualDate);
    }
  };


  const dismissFromPicker = () => setShowFromPicker(false);
  const dismissToPicker = () => setShowToPicker(false);


  const exportCSV = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const api = authApis(token);
      const params = { format: "csv" };
      if (fromDate) params.from = formatDateString(fromDate);
      if (toDate) params.to = formatDateString(toDate);

      const res = await api.get(endpoints["admin-transactions"], { params });
      if (res.data) {
        await Share.share({
          message: res.data,
          title: "Báo cáo doanh thu",
        });
      }
    } catch (ex) {
      console.debug("Lỗi xuất CSV:", ex.message);
    }
  };


  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0, 
    color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`, // Sắc tím chủ đạo của app
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
    barPercentage: 0.5,
  };


  const renderCharts = () => {
    if (!stats) return null;


    const methodLabels = stats.by_method?.map(m => (m.payment_method || "N/A").toUpperCase()) || [];
    const methodData = stats.by_method?.map(m => Number(m.revenue || 0) / 1000) || []; // Đơn vị: nghìn đồng

    const barChartData = {
      labels: methodLabels.length ? methodLabels : ["Trống"],
      datasets: [{ data: methodData.length ? methodData : [0] }]
    };


    const statusColors = { success: colors.primary, pending: "#F59E0B", failed: colors.danger };
    const pieChartData = stats.by_status?.map(s => ({
      name: s.status === "success" ? "Thành công" : s.status === "pending" ? "Chờ xử lý" : "Thất bại",
      count: s.count || 0,
      color: statusColors[s.status] || colors.gray,
      legendFontColor: "#555555",
      legendFontSize: 11
    })) || [];

    return (
      <View style={{ marginTop: 8 }}>
        {/* ĐỒ THỊ CỘT */}
        <Surface style={styles.chartCard} elevation={1}>
          <Text variant="titleSmall" style={styles.chartTitle}>Doanh thu phân loại cổng (Đơn vị: nghìn đồng)</Text>
          {methodData.some(val => val > 0) ? (
            <BarChart
              data={barChartData}
              width={screenWidth - 54}
              height={220}
              chartConfig={chartConfig}
              fromZero={true}
            />
          ) : (
            <Text style={styles.emptyChartText}>Chưa có phát sinh doanh thu tiền mặt</Text>
          )}
        </Surface>

        {/* ĐỒ THỊ TRÒN */}
        <Surface style={styles.chartCard} elevation={1}>
          <Text variant="titleSmall" style={styles.chartTitle}>Tỷ lệ phân loại trạng thái đơn hàng</Text>
          {pieChartData.length > 0 ? (
            <PieChart
              data={pieChartData}
              width={screenWidth - 54}
              height={160}
              chartConfig={chartConfig}
              accessor={"count"}
              backgroundColor={"transparent"}
              paddingLeft={"10"}
              absolute
            />
          ) : (
            <Text style={styles.emptyChartText}>Không có dữ liệu phân loại trạng thái</Text>
          )}
        </Surface>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Báo cáo quản trị" showBack />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* KHU VỰC BỘ LỌC THỜI GIAN CHỌN LỊCH */}
        <Surface style={styles.filterCard} elevation={1}>
          <Text variant="titleSmall" style={styles.sectionTitle}>Bộ lọc thời gian</Text>
          <Divider style={Styles.mb10} />
          
          <View style={styles.rowInputs}>
            {/* Nút bấm mở bộ chọn ngày bắt đầu */}
            <Button 
              mode="outlined" 
              icon="calendar"
              style={[styles.dateButton, { marginRight: 8 }]} 
              contentStyle={styles.dateButtonContent}
              labelStyle={{ fontSize: 13, color: colors.black }}
              onPress={() => setShowFromPicker(true)}
            >
              {fromDate ? `Từ: ${formatDateString(fromDate)}` : "Chọn ngày bắt đầu"}
            </Button>

            {/* Nút bấm mở bộ chọn ngày kết thúc */}
            <Button 
              mode="outlined" 
              icon="calendar"
              style={styles.dateButton} 
              contentStyle={styles.dateButtonContent}
              labelStyle={{ fontSize: 13, color: colors.black }}
              onPress={() => setShowToPicker(true)}
            >
              {toDate ? `Đến: ${formatDateString(toDate)}` : "Chọn ngày kết thúc"}
            </Button>
          </View>

          {/* RENDERING BỘ CHỌN LỊCH SỬ DỤNG PHƯƠNG THỨC MỚI */}
          {showFromPicker && (
            <DateTimePicker
              value={fromDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onValueChange={onFromValueChange}
              onDismiss={dismissFromPicker}
            />
          )}

          {showToPicker && (
            <DateTimePicker
              value={toDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onValueChange={onToValueChange}
              onDismiss={dismissToPicker}
            />
          )}

          <View style={[Styles.row, { justifyContent: "space-between", marginTop: 16 }]}>
            <Button mode="outlined" compact onPress={() => { setFromDate(null); setToDate(null); }}>Làm mới</Button>
            <Button mode="contained" icon="file-excel" style={{ backgroundColor: colors.primary }} onPress={exportCSV}>Xuất CSV</Button>
          </View>
        </Surface>

        {/* KHU VỰC THỐNG KÊ SỐ LIỆU */}
        <Surface style={styles.summaryCard} elevation={1}>
          <Text variant="titleSmall" style={styles.sectionTitle}>Thống kê tài chính</Text>
          <Divider style={Styles.mb10} />
          {loading ? (
            <View style={[Styles.row, { paddingVertical: 10, gap: 8 }]}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text variant="bodySmall" style={{ color: colors.gray }}>Đang tính toán số liệu...</Text>
            </View>
          ) : stats ? (
            <>
              <Text variant="bodyMedium" style={styles.infoLine}>
                Tổng doanh thu thực tế:{" "}
                <Text style={{ color: colors.primary, fontWeight: "800" }}>
                  {Number(stats.total_revenue ?? stats.revenue ?? 0).toLocaleString("vi-VN")}₫
                </Text>
              </Text>
              <Text variant="bodyMedium" style={styles.infoLine}>
                Tổng số lượng giao dịch:{" "}
                <Text style={{ fontWeight: "700", color: colors.black }}>
                  {stats.total_transactions ?? stats.count ?? 0} đơn hàng
                </Text>
              </Text>
              {stats.top_method && (
                <Text variant="bodyMedium" style={styles.infoLine}>
                  Cổng thịnh hành nhất:{" "}
                  <Text style={{ color: colors.secondary, fontWeight: "700" }}>
                    {stats.top_method.toUpperCase()}
                  </Text>
                </Text>
              )}
            </>
          ) : (
            <Text variant="bodySmall" style={{ color: colors.gray }}>Không có dữ liệu thống kê.</Text>
          )}
        </Surface>

        {/* KHU VỰC ĐỒ THỊ */}
        {!loading && renderCharts()}

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  filterCard: { backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 10, marginHorizontal: 15, marginTop: 15 },
  summaryCard: { backgroundColor: colors.white, borderRadius: 12, padding: 12, marginBottom: 10, marginHorizontal: 15 },
  chartCard: { backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 12, marginHorizontal: 15 },
  sectionTitle: { fontWeight: "700", color: colors.black, marginBottom: 5 },
  chartTitle: { fontWeight: "700", color: colors.black, marginBottom: 14, fontSize: 13 },
  rowInputs: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  dateButton: { flex: 1, backgroundColor: colors.bg, borderColor: colors.border, borderRadius: 8 },
  dateButtonContent: { height: 40, justifyContent: "flex-start" },
  infoLine: { marginVertical: 4, color: "#333333" },
  emptyChartText: { textAlign: 'center', color: colors.gray, paddingVertical: 30, fontSize: 12, fontStyle: 'italic' },
});

export default ReportScreen;