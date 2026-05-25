import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Image } from "react-native";
import { Text, Surface, RadioButton, Button, Divider, Icon } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import Styles, { colors } from "../../styles/Styles";
import { Header, Loading } from "../../components/common";

const METHODS = [
  { value: "momo",  label: "MoMo",  icon: "wallet",        color: "#A50064" },
  { value: "vnpay", label: "VNPay", icon: "credit-card",   color: "#0066CC" },
];

const CheckoutScreen = () => {
  const nav    = useNavigation();
  const route  = useRoute();
  const course = route.params?.course;

  const [method,  setMethod]  = useState("momo");
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res   = await authApis(token).post(endpoints["pay"], {
        course_id:      course.id,
        payment_method: method,
      });

      // Thanh toán xong → navigate vào khoá học
      nav.replace("PaymentResult", {
        success:    true,
        courseName: res.data.course_name,
        courseId:   res.data.course_id,
      });
    } catch (ex) {
      const msg = ex.response?.data?.detail ?? "Thanh toán thất bại!";
      nav.replace("PaymentResult", { success: false, message: msg });
    } finally {
      setLoading(false);
    }
  };

  if (!course) return <Loading text="Không tìm thấy khoá học." />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Thanh toán" showBack />

      <ScrollView contentContainerStyle={Styles.p15}>

        {/* ── Thông tin khoá học ── */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleSmall" style={styles.sectionTitle}>Khoá học</Text>
          <Divider style={Styles.mb10} />
          <View style={Styles.row}>
            {course.image ? (
              <Image source={{ uri: course.image }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbFallback]}>
                <Icon source="book-open-variant" size={28} color={colors.white} />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text variant="titleSmall" style={{ fontWeight: "700", color: colors.black }}>
                {course.subject}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.gray, marginTop: 4 }}>
                {course.teacher?.first_name} {course.teacher?.last_name}
              </Text>
            </View>
          </View>
        </Surface>

        {/* ── Chọn phương thức ── */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleSmall" style={styles.sectionTitle}>Phương thức thanh toán</Text>
          <Divider style={Styles.mb10} />

          <RadioButton.Group value={method} onValueChange={setMethod}>
            {METHODS.map((m) => (
              <View key={m.value} style={[Styles.between, styles.methodRow]}>
                <View style={Styles.row}>
                  <Icon source={m.icon} size={22} color={m.color} />
                  <Text variant="bodyLarge" style={{ marginLeft: 10, color: colors.black, fontWeight: "600" }}>
                    {m.label}
                  </Text>
                </View>
                <RadioButton value={m.value} color={colors.primary} />
              </View>
            ))}
          </RadioButton.Group>
        </Surface>

        {/* ── Tổng tiền ── */}
        <Surface style={styles.card} elevation={1}>
          <View style={Styles.between}>
            <Text variant="bodyLarge" style={{ color: colors.gray }}>Tổng thanh toán</Text>
            <Text variant="titleMedium" style={{ color: colors.primary, fontWeight: "800" }}>
              {Number(course.price).toLocaleString("vi-VN")}₫
            </Text>
          </View>
        </Surface>

        {/* ── Nút thanh toán ── */}
        <Button
          mode="contained"
          icon="check-circle"
          onPress={pay}
          loading={loading}
          disabled={loading}
          style={[Styles.mt10, { borderRadius: 10 }]}
          contentStyle={{ paddingVertical: 6 }}
        >
          Xác nhận thanh toán qua {METHODS.find((m) => m.value === method)?.label}
        </Button>

        <Button
          mode="outlined"
          onPress={() => nav.goBack()}
          disabled={loading}
          style={[Styles.mt10, { borderRadius: 10 }]}
        >
          Huỷ
        </Button>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card:         { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontWeight: "700", color: colors.black, marginBottom: 8 },
  thumb:        { width: 64, height: 64, borderRadius: 8 },
  thumbFallback:{ backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  methodRow:    {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});

export default CheckoutScreen;
