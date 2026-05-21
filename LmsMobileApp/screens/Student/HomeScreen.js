import React, { useCallback, useContext, useState } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Surface, Icon, Badge } from "react-native-paper";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/MyContext";
import Styles, { colors } from "../../styles/Styles";
import { Header, Loading } from "../../components/common";
import { CourseCard } from "../../components/courses";

const HomeScreen = () => {
  const nav = useNavigation();
  const [user] = useContext(MyUserContext);

  const [recommended, setRecommended] = useState(null); // 1 khoá AI đề xuất
  const [enrolled, setEnrolled]       = useState([]);   // ds khoá đang học
  const [loading, setLoading]         = useState(true);

  /**
   * Gọi API lấy:
   *  1. Khoá AI đề xuất:
   *     - Ưu tiên endpoint riêng: GET /courses/recommended/   (nếu BE có)
   *     - Fallback: GET /courses/?ordering=-rating&limit=1    (lấy khoá rating cao nhất)
   *     Tuỳ BE của bạn, chọn 1 trong 2 cách bên dưới và bỏ comment tương ứng.
   *
   *  2. Danh sách khoá đang học của user (enrollment active).
   */
  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      const [recRes, enrollRes] = await Promise.all([
       //thay AI giới thiệu ở đây
        Apis.get(endpoints["courses"], { params: { ordering: "-rating", limit: 1 } }),

        token
          ? authApis(token)
              .get(endpoints["my-courses"], { params: { status: "active" } })
              .catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
      ]);

      // Lấy khoá đầu tiên làm "AI đề xuất"
      const recList = recRes.data.results ?? recRes.data;
      setRecommended(Array.isArray(recList) ? recList[0] ?? null : null);

      setEnrolled((enrollRes.data.results ?? enrollRes.data).slice(0, 5));
    } catch (ex) {
      console.error("Lỗi tải trang chủ:", ex);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHomeData();
    }, [])
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Chào buổi sáng";
    if (h < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title="LMS"
        subtitle={`${greeting()}, ${user?.first_name ?? "bạn"} 👋`}
        showSearch
        showNotif
        onSearch={() => nav.navigate("CourseSearch")}
      />

      {loading ? (
        <Loading text="Đang tải dữ liệu..." />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* ── AI ĐỀ XUẤT ── */}
          <View style={styles.section}>
            <View style={[Styles.between, styles.sectionHeader]}>
              <View style={styles.aiLabelRow}>
                <Icon source="robot-excited-outline" size={18} color={colors.primary} />
                <Text variant="titleMedium" style={[styles.sectionTitle, { marginLeft: 6 }]}>
                  Dành riêng cho bạn
                </Text>
              </View>
              <TouchableOpacity onPress={() => nav.navigate("CourseList")}>
                <Text variant="bodySmall" style={styles.seeAll}>Khám phá thêm</Text>
              </TouchableOpacity>
            </View>

            {recommended ? (
              <Surface style={styles.aiCard} elevation={2}>
                {/* Badge AI */}
                <View style={styles.aiBadge}>
                  <Icon source="star-four-points" size={12} color={colors.white} />
                  <Text style={styles.aiBadgeText}>AI gợi ý</Text>
                </View>
                <CourseCard
                  course={recommended}
                  onPress={() => nav.navigate("CourseDetail", { courseId: recommended.id })}
                />
              </Surface>
            ) : (
              <EmptyBox message="Chưa có đề xuất nào. Hãy khám phá khoá học!" />
            )}
          </View>

          {/* ── KHOÁ ĐANG HỌC ── */}
          <View style={[styles.section, { marginTop: 6 }]}>
            <View style={[Styles.between, styles.sectionHeader]}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Đang học</Text>
              <TouchableOpacity onPress={() => nav.navigate("MyCourse")}>
                <Text variant="bodySmall" style={styles.seeAll}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            {enrolled.length > 0 ? (
              enrolled.map((item) => {
                const course = item.course ?? item;
                const courseId = item.course?.id ?? item.course ?? item.id;
                return (
                  <CourseCard
                    key={courseId ?? item.id}
                    course={{
                      ...course,
                      subject: item.course_name ?? course.name ?? course.title ?? course.subject,
                      image: item.course_image ?? course.image,
                      teacher_name: course.teacher_name ?? course.instructor_name ?? course.author,
                    }}
                    onPress={() => nav.navigate("MaterialList", { courseId })}
                  />
                );
              })
            ) : (
              <EmptyBox message="Bạn chưa đăng ký khoá học nào." />
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
};

/** Component hiển thị trạng thái rỗng */
const EmptyBox = ({ message }) => (
  <View style={styles.emptyContainer}>
    <Icon source="alert-circle-outline" color={colors.gray} size={30} />
    <Text style={{ color: colors.gray, marginTop: 5, textAlign: "center" }}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  section:       { paddingHorizontal: 15, marginTop: 15 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle:  { fontWeight: "700", color: colors.black },
  seeAll:        { color: colors.primary, fontWeight: "600" },

  aiLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiCard: {
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
  },
  aiBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  aiBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
});

export default HomeScreen;
