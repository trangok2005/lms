import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Avatar, Icon } from "react-native-paper";
import Styles, { colors } from "../../styles/Styles";

/**
 * CommentSection — hiển thị 1 reply trong ForumDetail
 * Props:
 *  - reply    (object) : dữ liệu reply
 *  - onDelete (func)   : callback xoá (chỉ hiện nếu là chủ reply)
 *  - isOwner  (bool)   : có phải chủ reply không
 */
const CommentSection = ({ reply, onDelete, isOwner = false }) => {
  const initial = reply.user?.first_name?.[0]?.toUpperCase()
               ?? reply.user?.username?.[0]?.toUpperCase()
               ?? "U";

  return (
    <View style={styles.container}>
      {/* Avatar + Tên */}
      <View style={[Styles.between, Styles.mb10]}>
        <View style={Styles.row}>
          {reply.user?.avatar ? (
            <Avatar.Image size={30} source={{ uri: reply.user.avatar }} />
          ) : (
            <Avatar.Text size={30} label={initial} style={{ backgroundColor: colors.secondary }} />
          )}
          <View style={{ marginLeft: 8 }}>
            <Text variant="labelMedium" style={{ color: colors.black, fontWeight: "700" }}>
              {reply.user?.first_name} {reply.user?.last_name}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.gray }}>
              {new Date(reply.created_date).toLocaleString("vi-VN")}
            </Text>
          </View>
        </View>

        {/* Nút xoá nếu là chủ */}
        {isOwner && (
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon source="trash-can-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>

      {/* Nội dung */}
      <Text variant="bodyMedium" style={styles.content}>
        {reply.content}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  content: { color: colors.black, lineHeight: 20 },
});

export default CommentSection;