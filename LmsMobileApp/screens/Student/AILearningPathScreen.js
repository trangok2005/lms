import React, { useState } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Text, TextInput, Button, Card, IconButton, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import Apis, { endpoints } from "../../configs/Apis";
import { colors } from "../../styles/Styles";

const AILearningPathScreen = () => {
  const theme = useTheme();
  const nav = useNavigation();

  // State nhap lieu form khao sat dau vao
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [hours, setHours] = useState("10");

  // State quan ly du lieu nhan ve tu he thong
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pathData, setPathData] = useState(null);

  // Buoc 1: Gui thong tin khao sat de AI nhan dien tra ve lo trinh so thao
  const handleGeneratePath = async () => {
    if (!goal.trim()) return Alert.alert("Thong bao", "Vui long nhap muc tieu hoc tap.");
    if (!hours || isNaN(hours)) return Alert.alert("Thong bao", "Thoi gian hoc phai la so hop le.");

    setLoading(true);
    try {
      const res = await Apis.post(endpoints["generate_ai_path"], {
        goal: goal,
        level: level,
        hours_per_week: parseInt(hours),
      });
      setPathData(res.data);
    } catch (error) {
      console.error("Loi generate lo trinh:", error);
      Alert.alert("Loi", "Khong the khoi tao lo trinh luc nay.");
    } finally {
      setLoading(false);
    }
  };

  // UI tuong tac: Xoa bo mot material khoi danh sach goi y hien tai
  const handleRemoveLesson = (id) => {
    setPathData((prev) => ({
      ...prev,
      materials: prev.materials.filter((item) => item.id !== id),
    }));
  };

  // UI tuong tac: Thay doi vi tri đẩy bài hoc len phia tren
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const updatedList = [...pathData.materials];
    const temp = updatedList[index - 1];
    updatedList[index - 1] = updatedList[index];
    updatedList[index] = temp;
    setPathData((prev) => ({ ...prev, materials: updatedList }));
  };

  // UI tuong tac: Thay doi vi tri day bai hoc xuong phia duoi
  const handleMoveDown = (index) => {
    if (index === pathData.materials.length - 1) return;
    const updatedList = [...pathData.materials];
    const temp = updatedList[index + 1];
    updatedList[index + 1] = updatedList[index];
    updatedList[index] = temp;
    setPathData((prev) => ({ ...prev, materials: updatedList }));
  };

  // Buoc 2: Thuc hien luu cau hinh cuoi cung kem theo xu ly chan luong thanh toan
  const handleSavePath = async (isPaidNow = false) => {
    if (!pathData || pathData.materials.length === 0) {
      return Alert.alert("Loi", "Danh sach bai hoc trong.");
    }
    
    // Chan hanh vi phia Client neu danh sach thuc te thap hon 4 tieu chi material
    if (pathData.materials.length < 4) {
      return Alert.alert("Thong bao", "Lo trinh hoc tap can dam bao chua toi thieu 4 bai hoc.");
    }

    setSaving(true);
    try {
      const finalMaterialIds = pathData.materials.map((m) => m.id);

      const res = await Apis.post(endpoints["save_ai_path"], {
        course_title: pathData.course_title,
        description: pathData.description,
        goal: goal,
        level: level,
        material_ids: finalMaterialIds,
        payment_confirmed: isPaidNow, 
      });

      Alert.alert("Thanh cong", "Lo trinh hoc tap cua ban da duoc khoi tao.", [
        { 
          text: "Vao hoc", 
          onPress: () => nav.navigate("ProgressTab", {
            screen: "MaterialList",
            params: { courseId: res.data.id }
          })
        },
      ]);
    } catch (error) {
      // Truong hop Backend tra ve ma 402 can thanh toan de tiep tuc
      if (error.response && error.response.status === 402) {
        const paymentInfo = error.response.data;
        Alert.alert(
          "Yeu cau thanh toan",
          `${paymentInfo.message}\nChi phi khoi tao: 100.000d`,
          [
            { text: "Huy bỏ", style: "cancel" },
            { 
              text: "Thanh toan", 
              onPress: () => {
                // Tich hop dieu huong qua luong thanh toan cua ban tai day
                // Sau khi thanh toan thanh cong, thuc hien goi lai ham: handleSavePath(true)
                Alert.alert("Thong bao", "Gia lap giao dich thanh cong. Dang xu ly khoi tao...", [
                  { text: "Tiep tuc", onPress: () => handleSavePath(true) }
                ]);
              }
            }
          ]
        );
      } else {
        console.error("Loi khi luu khoa hoc AI:", error);
        Alert.alert("Loi", "Khong the luu lo trinh hoc tap.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.titlePage}>AI Khoi Tao Lo Trinh Hoc</Text>

      {!pathData ? (
        <Card style={styles.formCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Khao sat nhu cau ca nhan</Text>
            
            <TextInput
              mode="outlined"
              label="Muc tieu hoc tap"
              value={goal}
              onChangeText={setGoal}
              style={styles.inputSpace}
              activeOutlineColor={colors.primary}
            />

            <TextInput
              mode="outlined"
              label="Trinh do hien tai"
              value={level}
              onChangeText={setLevel}
              style={styles.inputSpace}
              activeOutlineColor={colors.primary}
            />

            <TextInput
              mode="outlined"
              label="So gio hoc moi tuan"
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
              Phan tich va De xuat
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <View style={styles.resultArea}>
          <Card style={styles.aiCourseHeaderCard}>
            <Card.Content>
              <Text style={styles.aiCourseTitle}>{pathData.course_title}</Text>
              <Text style={styles.aiCourseDesc}>{pathData.description}</Text>
            </Card.Content>
          </Card>

          <View style={styles.headlineRow}>
            <Text style={{ fontWeight: "700" }}>Cau truc bai hoc ({pathData.materials.length})</Text>
          </View>

          {pathData.materials.map((item, index) => (
            <Card key={`${item.id}-${index}`} style={styles.lessonCard}>
              <Card.Content style={styles.lessonContent}>
                <View style={styles.lessonTextInfo}>
                  <Text style={styles.lessonTitle}>
                    {index + 1}. {item.title}
                  </Text>
                  <Text style={{ color: "orange", textTransform: "uppercase", fontSize: 10, fontWeight: "600" }}>
                    Loai: {item.material_type} - {item.duration_minutes} phut
                  </Text>
                </View>

                <View style={styles.lessonActionGroup}>
                  <IconButton
                    icon="chevron-up"
                    size={20}
                    style={styles.actionIcon}
                    disabled={index === 0}
                    onPress={() => handleMoveUp(index)}
                  />
                  <IconButton
                    icon="chevron-down"
                    size={20}
                    style={styles.actionIcon}
                    disabled={index === pathData.materials.length - 1}
                    onPress={() => handleMoveDown(index)}
                  />
                  <IconButton
                    icon="delete"
                    iconColor="red"
                    size={20}
                    style={styles.actionIcon}
                    onPress={() => handleRemoveLesson(item.id)}
                  />
                </View>
              </Card.Content>
            </Card>
          ))}

          <Button
            mode="contained"
            style={[styles.mainBtn, { backgroundColor: "#4CAF50", marginTop: 25 }]}
            onPress={() => handleSavePath(false)}
            loading={saving}
            disabled={saving}
          >
            Dong y va Khoi tao lo trinh
          </Button>

          <Button
            mode="outlined"
            textColor={colors.primary}
            style={[styles.outlineBtn, { borderColor: colors.primary }]}
            onPress={() => setPathData(null)}
            disabled={saving}
          >
            Thuc hien khao sat khac
          </Button>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 15 },
  titlePage: { fontSize: 20, fontWeight: "800", textAlign: "center", marginVertical: 20, color: colors.black },
  formCard: { backgroundColor: colors.white, borderRadius: 14, elevation: 3, paddingVertical: 10 },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 15, textAlign: "center" },
  inputSpace: { marginBottom: 16 },
  mainBtn: { paddingVertical: 6, borderRadius: 10 },
  outlineBtn: { paddingVertical: 4, borderRadius: 10, marginTop: 12 },
  resultArea: { marginTop: 5 },
  aiCourseHeaderCard: { backgroundColor: "#ECE9FF", marginBottom: 20, borderRadius: 12 },
  aiCourseTitle: { fontSize: 18, fontWeight: "800", color: "#4A3AFF" },
  aiCourseDesc: { marginTop: 6, color: "#555", lineHeight: 20 },
  headlineRow: { marginBottom: 15 },
  lessonCard: { backgroundColor: colors.white, marginBottom: 10, borderRadius: 10, elevation: 1 },
  lessonContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  lessonTextInfo: { flex: 1, paddingRight: 10 },
  lessonTitle: { fontSize: 14, fontWeight: "700", color: colors.black, marginBottom: 2 },
  lessonActionGroup: { flexDirection: "row", alignItems: "center" },
  actionIcon: { margin: 0 },
});

export default AILearningPathScreen;