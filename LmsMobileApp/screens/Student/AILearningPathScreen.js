import React, { useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { Text, TextInput, Button, Card, IconButton, Chip } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Apis, { endpoints, authApis } from "../../configs/Apis";
import Styles, { colors } from "../../styles/Styles";
import { Header } from "../../components/common";

const LEVEL_OPTIONS = ["beginner", "intermediate", "advanced"];
const MIN_MATERIALS = 4;
const MAX_MATERIALS = 10;

const AILearningPathScreen = () => {
  const nav = useNavigation();


  const [goal,  setGoal]  = useState("");
  const [level, setLevel] = useState("beginner");
  const [hours, setHours] = useState("10");


  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [pathData, setPathData] = useState(null);

  useFocusEffect(
    useCallback(() => {
      setPathData(null);
    }, [])
  );


  const validateForm = () => {
    const trimmedGoal = goal.trim();
    if (trimmedGoal.length < 10)
      return "Mục tiêu học tập phải có ít nhất 10 ký tự.";
    if (trimmedGoal.length > 300)
      return "Mục tiêu học tập không được vượt quá 300 ký tự.";
    if (!LEVEL_OPTIONS.includes(level))
      return "Trình độ không hợp lệ. Chọn: beginner / intermediate / advanced.";
    const h = parseInt(hours, 10);
    if (isNaN(h) || h < 1 || h > 168)
      return "Số giờ học mỗi tuần phải từ 1 đến 168.";
    return null;
  };


  const handleGeneratePath = async () => {
    const err = validateForm();
    if (err) return Alert.alert("Thông báo", err);

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).post(endpoints["generate_ai"], {
        goal:          goal.trim(),
        level,
        hours_per_week: parseInt(hours, 10),
      });


      if (res.data?.error) {
        return Alert.alert("Không hợp lệ", res.data.error);
      }

      setPathData(res.data);
    } catch (error) {
      if (error.response?.status === 429) {
          return Alert.alert(
            "Đã đạt giới hạn",
            `Bạn đã dùng hết lượt tạo lộ trình hôm nay.\nVui lòng thử lại vào hôm sau.`
          );
        }

      const msg =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Không thể khởi tạo lộ trình lúc này. Vui lòng thử lại.";
      Alert.alert("Lỗi", msg);
    } finally {
      setLoading(false);
    }
  };


  const handleRemoveLesson = (id) => {
    const next = pathData.materials.filter((m) => m.id !== id);
    if (next.length < MIN_MATERIALS) {
      return Alert.alert(
        "Không thể xoá",
        `Lộ trình cần tối thiểu ${MIN_MATERIALS} bài học.`
      );
    }
    setPathData((prev) => ({ ...prev, materials: next }));
  };


  const handleMove = (index, direction) => {
    const list = [...pathData.materials];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    [list[index], list[swapIdx]] = [list[swapIdx], list[index]];
    setPathData((prev) => ({ ...prev, materials: list }));
  };


  const handleSavePath = async () => {
    if (!pathData || pathData.materials.length === 0)
      return Alert.alert("Lỗi", "Danh sách bài học trống.");
    if (pathData.materials.length < MIN_MATERIALS)
      return Alert.alert(
        "Thông báo",
        `Lộ trình cần tối thiểu ${MIN_MATERIALS} bài học.`
      );
    if (pathData.materials.length > MAX_MATERIALS)
      return Alert.alert(
        "Thông báo",
        `Lộ trình không được vượt quá ${MAX_MATERIALS} bài học.`
      );

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).post(endpoints["save_ai"], {
        course_title: pathData.course_title,
        description: pathData.description,
        goal: goal.trim(),
        level,
        material_ids: pathData.materials.map((m) => m.id),
      });

      setPathData(null);
      Alert.alert("Thành công", "Lộ trình học tập của bạn đã được khởi tạo.", [
        {
          text: "Vào học",
          onPress: () =>
            nav.navigate("HomeTab", {
              screen: "MaterialList",
              params: { courseId: res.data.id },
            }),
        },
      ]);
    } catch (error) {
      const msg =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Không thể lưu lộ trình học tập. Vui lòng thử lại.";
      Alert.alert("Lỗi", msg);
    } finally {
      setSaving(false);
    }
  };




  return (
    <View style={Styles.container}>
      <Header title="AI Khởi Tạo Lộ Trình" showBack />
      <ScrollView showsVerticalScrollIndicator={false}
      >
      {/* ── FORM KHẢO SÁT ── */}
      {!pathData ? (
        <Card style={styles.formCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Khảo sát nhu cầu cá nhân</Text>

            <TextInput
              mode="outlined"
              label="Mục tiêu học tập"
              value={goal}
              onChangeText={setGoal}
              multiline
              numberOfLines={3}
              maxLength={300}
              style={styles.inputSpace}
              activeOutlineColor={colors.primary}
            />
            <Text style={styles.charCount}>{goal.trim().length}/300</Text>

            {/* Chọn trình độ bằng Chip */}
            <Text style={styles.fieldLabel}>Trình độ hiện tại</Text>
            <View style={styles.chipRow}>
              {LEVEL_OPTIONS.map((opt) => (
                <Chip
                  key={opt}
                  selected={level === opt}
                  onPress={() => setLevel(opt)}
                  style={[
                    styles.chip,
                    level === opt && { backgroundColor: colors.primary },
                  ]}
                  textStyle={{ color: level === opt ? "#fff" : colors.black, textTransform: "capitalize" }}
                >
                  {opt}
                </Chip>
              ))}
            </View>

            <TextInput
              mode="outlined"
              label="Số giờ học mỗi tuần (1–168)"
              keyboardType="numeric"
              value={hours}
              onChangeText={setHours}
              style={styles.inputSpace}
              activeOutlineColor={colors.primary}
            />

            <Button
              mode="contained"
              style={[styles.mainBtn, { backgroundColor: colors.primary }]}
              onPress={handleGeneratePath}
              loading={loading}
              disabled={loading}
            >
              Phân tích và Đề xuất
            </Button>
          </Card.Content>
        </Card>
      ) : (
        /* ── KẾT QUẢ + CHỈNH SỬA ── */
        <View style={styles.resultArea}>

          {/* Header khoá học */}
          <Card style={styles.aiCourseHeaderCard}>
            <Card.Content>
              <Text style={styles.aiCourseTitle}>{pathData.course_title}</Text>
              <Text style={styles.aiCourseDesc}>{pathData.description}</Text>
            </Card.Content>
          </Card>

          {/* Tiêu đề danh sách */}
          <View style={styles.headlineRow}>
            <Text style={{ fontWeight: "700" }}>
              Cấu trúc bài học ({pathData.materials.length}/{MAX_MATERIALS})
            </Text>
            {pathData.materials.length < MIN_MATERIALS && (
              <Text style={styles.warningText}>
                ⚠ Cần thêm ít nhất {MIN_MATERIALS - pathData.materials.length} bài
              </Text>
            )}
          </View>

          {/* Danh sách bài học */}
          {pathData.materials.map((item, index) => (
            <Card key={`${item.id}-${index}`} style={styles.lessonCard}>
              <Card.Content style={styles.lessonContent}>
                <View style={styles.lessonTextInfo}>
                  <View style={styles.lessonTitleRow}>
                    <Text style={styles.lessonTitle} numberOfLines={2}>
                      {index + 1}. {item.title}
                    </Text>
                  </View>
                  <Text style={styles.lessonMeta}>
                    {item.material_type?.toUpperCase()} · {item.duration_minutes} phút
                  </Text>
                </View>

                {/* Nút điều khiển */}
                <View style={styles.lessonActionGroup}>
                  <IconButton
                    icon="chevron-up"
                    size={20}
                    style={styles.actionIcon}
                    disabled={index === 0}
                    onPress={() => handleMove(index, "up")}
                  />
                  <IconButton
                    icon="chevron-down"
                    size={20}
                    style={styles.actionIcon}
                    disabled={index === pathData.materials.length - 1}
                    onPress={() => handleMove(index, "down")}
                  />
                  <IconButton
                    icon="delete"
                    iconColor={pathData.materials.length <= MIN_MATERIALS ? "#ccc" : "red"}
                    size={20}
                    style={styles.actionIcon}
                    disabled={pathData.materials.length <= MIN_MATERIALS}
                    onPress={() => handleRemoveLesson(item.id)}
                  />
                </View>
              </Card.Content>
            </Card>
          ))}

          {/* Nút lưu */}
          <Button
            mode="contained"
            style={[
              styles.mainBtn,
              {
                backgroundColor:
                  pathData.materials.length < MIN_MATERIALS ? "#aaa" : "#4CAF50",
                marginTop: 25,
              },
            ]}
            onPress={handleSavePath}
            loading={saving}
            disabled={saving || pathData.materials.length < MIN_MATERIALS}
          >
            Đồng ý & Khởi tạo lộ trình
          </Button>

          <Button
            mode="outlined"
            textColor={colors.primary}
            style={[styles.outlineBtn, { borderColor: colors.primary }]}
            onPress={() => setPathData(null)}
            disabled={saving}
          >
            Khảo sát lại
          </Button>
        </View>
      )}
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: colors.bg, padding: 15 },
  titlePage:            { fontSize: 20, fontWeight: "800", textAlign: "center", marginVertical: 20, color: colors.black },


  formCard:             { backgroundColor: colors.white, borderRadius: 14, elevation: 3, paddingVertical: 10 },
  cardTitle:            { fontSize: 16, fontWeight: "700", marginBottom: 15, textAlign: "center" },
  inputSpace:           { marginBottom: 8 },
  charCount:            { fontSize: 11, color: "#999", textAlign: "right", marginBottom: 12 },
  fieldLabel:           { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 8 },
  chipRow:              { flexDirection: "row", gap: 8, marginBottom: 16 },
  chip:                 { backgroundColor: "#eee" },


  mainBtn:              { paddingVertical: 6, borderRadius: 10 },
  outlineBtn:           { paddingVertical: 4, borderRadius: 10, marginTop: 12 },


  resultArea:           { marginTop: 5 },
  aiCourseHeaderCard:   { backgroundColor: "#ECE9FF", marginBottom: 20, borderRadius: 12 },
  aiCourseTitle:        { fontSize: 18, fontWeight: "800", color: "#4A3AFF" },
  aiCourseDesc:         { marginTop: 6, color: "#555", lineHeight: 20 },


  premiumBanner:        { marginTop: 12, backgroundColor: "#FFF3CD", borderRadius: 8, padding: 10 },
  premiumBannerText:    { fontSize: 13, color: "#856404", fontWeight: "600" },


  headlineRow:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  warningText:          { fontSize: 12, color: "red", fontWeight: "600" },


  lessonCard:           { backgroundColor: colors.white, marginBottom: 10, borderRadius: 10, elevation: 1 },
  lessonCardPremium:    { borderLeftWidth: 4, borderLeftColor: "#FFD700" },
  lessonContent:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  lessonTextInfo:       { flex: 1, paddingRight: 6 },
  lessonTitleRow:       { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  lessonTitle:          { fontSize: 14, fontWeight: "700", color: colors.black, marginBottom: 2, flexShrink: 1 },
  premiumBadge:         { fontSize: 10, color: "#856404", backgroundColor: "#FFF3CD", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, fontWeight: "700" },
  lessonMeta:           { color: "orange", textTransform: "uppercase", fontSize: 10, fontWeight: "600", marginTop: 2 },
  lessonActionGroup:    { flexDirection: "row", alignItems: "center" },
  actionIcon:           { margin: 0 },
});

export default AILearningPathScreen;