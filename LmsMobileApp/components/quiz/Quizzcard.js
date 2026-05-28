import React from "react";
import { View, Image, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Text, Icon } from "react-native-paper";

const LEVEL_CONFIG = {
  beginner:     { label: "Dễ",         color: "#0F6E56", bg: "#E1F5EE" },
  intermediate: { label: "Trung bình", color: "#854F0B", bg: "#FAEEDA" },
  advanced:     { label: "Nâng cao",   color: "#993C1D", bg: "#FAECE7" },
};

/**
 * QuizzCard
 * Dùng trong QuizCourseScreen để hiển thị khóa học kèm tiến độ.
 * Tự xử lý việc chặn điều hướng nếu progress < 100.
 *
 * Props:
 *   course     – object khóa học (id, subject, level, image, teacher, progress)
 *   onPress    – callback khi khóa học đã mở khóa (progress === 100)
 */
const QuizzCard = ({ course, onPress }) => {
  const progress    = course.progress ?? 0;
  const lv          = LEVEL_CONFIG[course.level] ?? LEVEL_CONFIG.beginner;
  const hasProgress = progress > 0;
  const isLocked    = progress < 100;

  const thumbBg     = isLocked ? "#3C3489" : "#1D9E75";
  const barColor    = isLocked ? "#EF9F27" : "#1D9E75";
  const barLabelClr = isLocked ? "#854F0B" : "#0F6E56";

  const handlePress = () => {
    if (isLocked) {
      Alert.alert(
        "Chưa thể làm bài kiểm tra",
        `Bạn mới hoàn thành ${progress}% khóa học.\nHãy học hết 100% để mở khóa bài kiểm tra.`,
        [{ text: "Đồng ý" }]
      );
      return;
    }
    onPress?.(course);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.85}>
      {/* Thumbnail */}
      <View style={[styles.thumb, { backgroundColor: thumbBg }]}>
        <Icon source="book-open-variant" size={32} color="rgba(255,255,255,0.7)" />
        {course.image && (
          <Image
            source={{ uri: course.image }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        )}
        {isLocked && (
          <View style={styles.lockOverlay}>
            <Icon source="lock" size={22} color="#fff" />
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {course.subject ?? course.title ?? course.name ?? ""}
          </Text>
          <View style={[styles.badge, { backgroundColor: lv.bg }]}>
            <Text style={[styles.badgeTxt, { color: lv.color }]}>{lv.label}</Text>
          </View>
        </View>

        <Text style={styles.teacher} numberOfLines={1}>
          {`${course.teacher?.first_name ?? ""} ${course.teacher?.last_name ?? ""}`.trim() || "Giảng viên"}
        </Text>

        {/* Progress bar */}
        {hasProgress && (
          <View style={styles.progressWrap}>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%`, backgroundColor: barColor },
                ]}
              />
            </View>
            <View style={styles.progressMeta}>
              <Text style={[styles.progressLabel, { color: barLabelClr }]}>
                {isLocked ? "Cần học đủ 100%" : "Hoàn thành"}
              </Text>
              <Text style={[styles.progressPct, { color: barLabelClr }]}>
                {progress}%
              </Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  thumb: {
    width: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
    justifyContent: "center",
    alignItems: "center",
  },
  body:     { flex: 1, padding: 14, gap: 5 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  title:    { flex: 1, fontSize: 14, fontWeight: "700", color: "#0f172a", lineHeight: 20 },
  badge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  badgeTxt: { fontSize: 11, fontWeight: "600" },
  teacher:  { fontSize: 12, color: "#64748b" },

  progressWrap:  { marginTop: 4, gap: 4 },
  progressBg:    { height: 4, backgroundColor: "#e2e8f0", borderRadius: 99, overflow: "hidden" },
  progressFill:  { height: "100%", borderRadius: 99 },
  progressMeta:  { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontSize: 11, fontWeight: "500" },
  progressPct:   { fontSize: 11, fontWeight: "500" },
});

export default QuizzCard;
