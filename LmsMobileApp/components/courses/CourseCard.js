import React from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Text, Chip, Icon } from "react-native-paper";
import Styles, { colors } from "../../styles/Styles";

const LEVEL_CONFIG = {
  beginner:     { label: "Dễ",         color: colors.primary },
  intermediate: { label: "Trung bình", color: "#F59E0B"      },
  advanced:     { label: "Nâng cao",   color: colors.danger  },
};

/**
 * CourseCard — card khoá học tái sử dụng
 * Props:
 *  - course  (object) : dữ liệu từ API
 *  - onPress (func)   : callback khi bấm
 */
const CourseCard = ({ course, onPress }) => {
  const lv    = LEVEL_CONFIG[course.level] ?? LEVEL_CONFIG.beginner;
  const isFree = !course.price || parseFloat(course.price) === 0;

  return (

    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Thumbnail */}
      {course.image ? (
        <Image source={{ uri: course.image }} style={Styles.thumbnail} />
      ) : (
        <View style={[Styles.thumbnail, styles.thumbnailFallback]}>
          <Icon source="book-open-variant" size={48} color={colors.white} />
        </View>
      )}

      <View style={styles.body}>
        {/* Tiêu đề */}
        <Text variant="titleSmall" style={styles.title} numberOfLines={2}>
          {course.subject}
        </Text>

        {/* Giảng viên */}
        <View style={[Styles.row, Styles.mb10]}> 
          <Icon source="account-tie" size={14} color={colors.gray} />
          <Text variant="bodySmall" style={styles.teacher} numberOfLines={1}>
            {course.teacher ? `${course.teacher.first_name ?? ""} ${course.teacher.last_name ?? ""}` : "Giảng viên"}
          </Text>
        </View>

        {/* Level + Giá */}
        <View style={Styles.between}>
          <Chip
            mode="outlined"
            style={[styles.chip, { borderColor: lv.color }]}
            textStyle={{ color: lv.color, fontSize: 11 }}
          >
            {lv.label}
          </Chip>
          <Text variant="titleSmall" style={[styles.price, { color: isFree ? colors.primary : colors.secondary }]}>
            {isFree ? "Miễn phí" : `${Number(course.price).toLocaleString("vi-VN")}₫`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 14,
    overflow: "hidden",
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  thumbnailFallback: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  body:    { padding: 12 },
  title:   { fontWeight: "700", color: colors.black, marginBottom: 6, lineHeight: 20 },
  teacher: { marginLeft: 4, color: colors.gray, flexShrink: 1 },
  chip:    { backgroundColor: "transparent", borderWidth: 1, marginRight: 8, flexShrink: 1, paddingVertical: 0},
  price:   { fontWeight: "700", fontSize: 14, flexShrink: 1, textAlign: "right" },
});

export default CourseCard;