import React from "react";
import { View } from "react-native";
import { Text, Icon } from "react-native-paper";
import Styles, { colors } from "../../styles/Styles";

/**
 * InfoRow — read only
 *
 * Props:
 *  - icon    (string) : tên icon react-native-paper
 *  - label   (string) : nhãn bên trái
 *  - value   (string) : giá trị bên phải
 *
 * Ví dụ:
 *  <InfoRow icon="email" label="Email" value="abc@gmail.com" />
 */

const InfoRow = ({ icon, label, value }) => (
  <View style={[Styles.between, Styles.rowItem]}>
    <View style={Styles.row}>
      <Icon source={icon} size={20} color={colors.gray} />
      <Text variant="bodyMedium" style={[Styles.rowLabel, { color: colors.gray }]}>
        {label}
      </Text>
    </View>
    <Text 
      variant="bodyMedium" 
      style={[Styles.rowValue, { color: colors.black }]} 
      numberOfLines={1}
    >
      {value ?? "—"}
    </Text>
  </View>
);

export default InfoRow;