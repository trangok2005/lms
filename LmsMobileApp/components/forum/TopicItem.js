import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text, Icon, Avatar } from "react-native-paper";
import Styles, { colors } from "../../styles/Styles";

/**
 * TopicItem — card 1 topic trong danh sách forum
 * Props:
 *  - topic   (object) : dữ liệu topic từ API
 *  - onPress (func)
 */
const TopicItem = ({ topic, onPress, onDelete, showDelete }) => {
  const initial = topic.user?.first_name?.[0]?.toUpperCase()
               ?? topic.user?.username?.[0]?.toUpperCase()
               ?? "U";

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Avatar + tên + delete */}
      <View style={[Styles.row, Styles.mb10, styles.topRow]}>
        <View style={[Styles.row, { flex: 1 }]}> 
          {topic.user?.avatar ? (
            <Avatar.Image size={36} source={{ uri: topic.user.avatar }} />
          ) : (
            <Avatar.Text size={36} label={initial} style={{ backgroundColor: colors.primary }} />
          )}
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text variant="labelLarge" style={{ color: colors.black, fontWeight: "700" }}>
              {topic.user?.first_name} {topic.user?.last_name}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.gray }}>
              {topic.course_name ?? ""}  ·  {new Date(topic.created_date).toLocaleDateString("vi-VN")}
            </Text>
          </View>
        </View>
        {showDelete && onDelete && (
          <TouchableOpacity
            onPress={onDelete}
            activeOpacity={0.7}
            style={styles.deleteButton}
          >
            <Icon source="trash-can-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tiêu đề */}
      <Text variant="titleSmall" style={styles.title} numberOfLines={2}>
        {topic.title}
      </Text>

      {/* Preview nội dung */}
      <Text variant="bodySmall" style={styles.preview} numberOfLines={2}>
        {topic.content}
      </Text>

      {/* Reply count */}
      <View style={[Styles.row, { marginTop: 8 }]}>
        <Icon source="comment-outline" size={14} color={colors.gray} />
        <Text variant="bodySmall" style={{ color: colors.gray, marginLeft: 4 }}>
          {topic.reply_count ?? 0} bình luận
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  title:   { color: colors.black, fontWeight: "700", marginBottom: 4, lineHeight: 20 },
  preview: { color: colors.gray, lineHeight: 18 },
  topRow: { alignItems: "flex-start" },
  deleteButton: {
    padding: 6,
    marginLeft: 10,
  },
});

export default TopicItem;