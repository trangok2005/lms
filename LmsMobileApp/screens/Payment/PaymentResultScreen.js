import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, Icon } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import Styles, { colors } from "../../styles/Styles";

const PaymentResultScreen = () => {
  const nav   = useNavigation();
  const route = useRoute();
  const { success, courseName, courseId, message } = route.params ?? {};

  return (
    <View style={[Styles.container, Styles.center]}>

      {/* Icon kết quả */}
      <Icon
        source={success ? "check-circle" : "close-circle"}
        size={80}
        color={success ? colors.primary : colors.danger}
      />

      <Text variant="headlineSmall" style={[styles.title, { color: success ? colors.primary : colors.danger }]}>
        {success ? "Thanh toán thành công!" : "Thanh toán thất bại"}
      </Text>

      {success ? (
        <Text variant="bodyMedium" style={styles.sub}>
          Bạn đã đăng ký khoá học{"\n"}
          <Text style={{ fontWeight: "700", color: colors.black }}>{courseName}</Text>
        </Text>
      ) : (
        <Text variant="bodyMedium" style={styles.sub}>
          {message ?? "Đã xảy ra lỗi, vui lòng thử lại."}
        </Text>
      )}

      {/* Nút hành động */}
      {success ? (
        <>
          <Button
            mode="contained"
            icon="play-circle"
            style={styles.btn}
            contentStyle={{ paddingVertical: 4 }}
            onPress={() => 
              nav.navigate("HomeTab", { 
                screen: "MaterialList", 
                params: { courseId: courseId }
              })
            }
          >
            Vào học ngay
          </Button>
          <Button
            mode="outlined"
            style={styles.btn}
            onPress={() => nav.navigate("Home")}
          >
            Về trang chủ
          </Button>
        </>
      ) : (
        <>
          <Button
            mode="contained"
            icon="refresh"
            style={styles.btn}
            contentStyle={{ paddingVertical: 4 }}
            onPress={() => nav.goBack()}
          >
            Thử lại
          </Button>
          <Button
            mode="outlined"
            style={styles.btn}
            onPress={() => nav.navigate("Home")}
          >
            Về trang chủ
          </Button>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  title: { fontWeight: "800", marginTop: 20, marginBottom: 10, textAlign: "center" },
  sub:   { color: colors.gray, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  btn:   { width: "100%", borderRadius: 10, marginBottom: 10 },
});

export default PaymentResultScreen;