import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Text, Icon } from "react-native-paper";
import Styles, { colors } from "../../styles/Styles";

/**
 * ActionRow — hàng chức năng có thể bấm
 *
 * Props:
 *  - icon     (string)   : tên icon react-native-paper
 *  - label    (string)   : nhãn hiển thị
 *  - onPress  (func)     : callback khi bấm
 *
 * Ví dụ:
 *  <ActionRow icon="pencil"  label="Chỉnh sửa"  onPress={() => nav.navigate('EditProfile')} />
 */

const ActionRow = ({ icon, label, onPress, danger = false }) => {
  const tint = danger ? colors.danger : colors.primary;
  
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[Styles.between, Styles.rowItem]} 
      activeOpacity={0.7}
    >
      <View style={Styles.row}>
        <Icon source={icon} size={20} color={tint} />
        <Text 
          variant="bodyMedium" 
          style={[Styles.rowLabel, { color: colors.black }]}
        >
          {label}
        </Text>
      </View>
      <Icon source="chevron-right" size={20} color={colors.gray} />
    </TouchableOpacity>
  );
};

export default ActionRow;