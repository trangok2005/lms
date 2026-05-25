import React, { useCallback, useContext, useState } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Icon } from "react-native-paper";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Apis, { endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/MyContext";
import Styles, { colors } from "../../styles/Styles";
import { Header, Loading } from "../../components/common";
import { CourseCard } from "../../components/courses";

const HomeScreen = () => {
  const nav = useNavigation();
  const [user] = useContext(MyUserContext);

  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Gọi API lấy:
   *  1. 5 khóa học nổi bật theo điểm đánh giá.
   */
  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const res = await Apis.get(endpoints["courses"], {
        params: { ordering: "-rating", limit: 5 },
      });

      const courseList = res.data.results ?? res.data ?? [];
      setFeaturedCourses(Array.isArray(courseList) ? courseList : []);
    } catch (ex) {
      console.debug("Lỗi tải trang chủ:", ex);
      setFeaturedCourses([]);
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

         <View style={[styles.section, { marginTop: 6 }]}> 
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Lộ trình học bằng AI</Text>
            </View>

            <Text style={styles.descriptionText}>
              Tạo ngay lộ trình học cá nhân hóa bằng AI để tiếp tục nâng cao kỹ năng.
            </Text>
            <TouchableOpacity style={styles.aiButton} onPress={() => nav.navigate("LearningDashboard")}>
              <Text variant="bodyMedium" style={styles.aiButtonText}>Tạo lộ trình học AI</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />

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
                  Có thể bạn sẽ thích
                </Text>
              </View>
            </View>

            {featuredCourses.length > 0 ? (
              featuredCourses.map((course) => {
                const courseId = course.id ?? course._id ?? course.course_id;
                return (
                  <CourseCard
                    key={courseId ?? `${course.title}-${Math.random()}`}
                    course={course}
                    onPress={() => nav.navigate("CourseDetail", { courseId })}
                  />
                );
              })
            ) : (
              <EmptyBox message="Chưa có khóa nổi bật. Hãy khám phá khoá học!" />
            )}
          </View>

          <View style={[styles.section, { marginTop: 6 }]}> 
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Lộ trình học bằng AI</Text>
            </View>

            <Text style={styles.descriptionText}>
              Tạo ngay lộ trình học cá nhân hóa bằng AI để tiếp tục nâng cao kỹ năng.
            </Text>
            <TouchableOpacity style={styles.aiButton} onPress={() => nav.navigate("LearningDashboard") }>
              <Text variant="bodyMedium" style={styles.aiButtonText}>Tạo lộ trình học AI</Text>
            </TouchableOpacity>
          </View>

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

  aiLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  descriptionText: {
    color: colors.gray,
    marginBottom: 12,
    lineHeight: 20,
  },
  aiButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  aiButtonText: {
    color: colors.white,
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
