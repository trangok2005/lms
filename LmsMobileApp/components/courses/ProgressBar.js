import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, ProgressBar as PaperProgress } from "react-native-paper";
import Styles, { colors } from "../../styles/Styles";

/**
 * ProgressBar — thanh tiến độ khoá học
 * Props:
 *  - percent (number) : 0 → 100
 *  - label   (string) : nhãn tuỳ chọn (mặc định hiện %)
 */
const ProgressBar = ({ percent = 0, label }) => {
  const value = Math.min(Math.max(percent, 0), 100) / 100;

  return (
    <View style={styles.container}>
      <View style={[Styles.between, Styles.mb10]}>
        <Text variant="bodySmall" style={{ color: colors.gray }}>
          {label ?? "Tiến độ"}
        </Text>
        <Text variant="bodySmall" style={{ color: colors.primary, fontWeight: "700" }}>
          {Math.round(percent)}%
        </Text>
      </View>
      <PaperProgress
        progress={value}
        color={colors.primary}
        style={styles.bar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 4 },
  bar:       { height: 8, borderRadius: 4, backgroundColor: colors.border },
});

export default ProgressBar;