import React from "react";
import { View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import Styles, { colors } from "../../styles/Styles";
 
/*
 * Loading — màn hình chờ toàn trang khi gọi API
 * Props:- text  
 * Ví dụ:
 *  <Loading text="Đang tải dữ liệu..." />
*/
const Loading = ({ text }) => (
  <View style={[Styles.container, Styles.center]}>
    <ActivityIndicator size="large" color={colors.primary} />
    {text && (
      <Text variant="bodyMedium" style={{ marginTop: 12, color: colors.gray }}>
        {text}
      </Text>
    )}
  </View>
);
 
export default Loading;