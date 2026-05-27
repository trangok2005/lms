import React, { useCallback, useContext, useState } from "react";
import { View, ScrollView, Image, StyleSheet } from "react-native";
import { Text, Button, Chip, Divider, Surface, Icon } from "react-native-paper";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/MyContext";
import Styles, { colors } from "../../styles/Styles";
import { Header, Loading, InfoRow } from "../../components/common";

const LEVEL_LABEL = {
  beginner:     "Dễ",
  intermediate: "Trung bình",
  advanced:     "Nâng cao",
};


const CourseDetailScreen = () => {
  const nav = useNavigation();
  const { params } = useRoute();
  const [user] = useContext(MyUserContext);

  const [course, setCourse]       = useState(null);
  const [enrolled, setEnrolled]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetch = async () => {
        try {
          setLoading(true);

          const token = await AsyncStorage.getItem("token");

          const api = token ? authApis(token) : Apis;

          const [courseRes, enrollRes] = await Promise.all([
            api.get(endpoints["course-detail"](params.courseId)),

            token
              ? authApis(token)
                  .get(endpoints["my-courses"])
                  .catch(() => ({ data: [] }))
              : Promise.resolve({ data: [] }),
          ]);

          //console.log(courseRes.data);

          setCourse(courseRes.data);

          const ids = (enrollRes.data.results ?? enrollRes.data)
            .map((e) => {
              const courseValue = e.course ?? e.course_id ?? e.id ?? e;
              if (typeof courseValue === "object") {
                return String(courseValue.id ?? courseValue._id ?? courseValue);
              }
              return String(courseValue);
            })
            .filter(Boolean);

          setEnrolled(ids.includes(String(params.courseId)));

        } catch (ex) {

          console.debug(ex.response?.data || ex);

        } finally {

          setLoading(false);

        }
      };

      fetch();

    }, [params.courseId])
  );

  const handleEnroll = async () => {
    if (!user) { nav.navigate("Login"); return; }
    const isFree = !course.price || parseFloat(course.price) === 0;
    if (!isFree) {
      nav.navigate("Checkout", { course });
      return;
    }
    try {
      setEnrolling(true);
      const token = await AsyncStorage.getItem("token");
      await authApis(token).post(endpoints["enroll"](course.id));
      setEnrolled(true);
    } catch (ex) {
      console.debug(ex);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <Loading text="Đang tải khoá học..." />;
  if (!course)  return <Loading text="Không tìm thấy khoá học." />;

  const isFree = !course.price || parseFloat(course.price) === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Chi tiết khoá học" showBack />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Thumbnail */}
        {course.image ? (
          <Image source={{ uri: course.image }} style={styles.banner} />
        ) : (
          <View style={[styles.banner, styles.bannerFallback]}>
            <Icon source="book-open-variant" size={64} color={colors.white} />
          </View>
        )}

        <View style={Styles.p15}>
          {/* Tên + badge level */}
          <View style={[Styles.between, Styles.mb10]}>
            <Text variant="headlineSmall" style={styles.title} numberOfLines={3}>
              {course.subject}
            </Text>
            <Chip style={styles.levelChip} textStyle={{ color: colors.white, fontSize: 12 }}>
              {LEVEL_LABEL[course.level] ?? course.level}
            </Chip>
          </View>

          {/* Tags */}
          {course.tags?.length > 0 && (
            <View style={[Styles.row, styles.tags]}>
              {course.tags.map((t) => (
                <Chip key={t.id} compact style={styles.tag} textStyle={{ fontSize: 11, color: colors.secondary }}>
                  #{t.name}
                </Chip>
              ))}
            </View>
          )}

          {/* Thông tin */}
          <Surface style={styles.card} elevation={1}>
            <Text variant="titleSmall" style={styles.sectionTitle}>Thông tin khoá học</Text>
            <Divider style={Styles.mb10} />
            <InfoRow icon="account-tie"    label="Giảng viên"  value=  {`${course.teacher.first_name} ${course.teacher.last_name}` ?? "Giảng viên"} />
            <InfoRow icon="shape"          label="Danh mục"    value={course.category.name ?? "—"} />
            <InfoRow icon="signal"         label="Cấp độ"      value={LEVEL_LABEL[course.level] ?? "—"} />
            <InfoRow icon="book-multiple"  label="Học liệu"    value={`${course.material_count ?? 0} bài`} />
            <InfoRow icon="account-group" label="Học viên"    value={`${course.student_count ?? 0} người`} />
          </Surface>

          {/* Mô tả */}
          {course.description ? (
            <Surface style={styles.card} elevation={1}>
              <Text variant="titleSmall" style={styles.sectionTitle}>Mô tả</Text>
              <Divider style={Styles.mb10} />
              <Text variant="bodyMedium" style={{ color: colors.gray, lineHeight: 22 }}>
                {course.description.replace(/<[^>]*>/g, "")}
              </Text>
            </Surface>
          ) : null}

          {/* Nút hành động */}
          {enrolled ? (
            <Button
              mode="contained"
              icon="play-circle"
              style={[styles.btn, { backgroundColor: colors.primary }]}
              contentStyle={styles.btnContent}
              onPress={() => 
                nav.navigate("ProgressTab", { 
                  screen: "MaterialList", 
                  params: { courseId: course?.id }
                })
              }
            >
              Vào học ngay
            </Button>
          ) : (
            <Button
              mode="contained"
              icon={isFree ? "check-circle" : "cart"}
              loading={enrolling}
              disabled={enrolling}
              style={[styles.btn, { backgroundColor: isFree ? colors.primary : colors.secondary }]}
              contentStyle={styles.btnContent}
              onPress={handleEnroll}
            >
              {isFree ? "Đăng ký miễn phí" : `Mua • ${Number(course.price).toLocaleString("vi-VN")}₫`}
            </Button>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  banner:        { width: "100%", height: 220 },
  bannerFallback:{ backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  title:         { flex: 1, fontWeight: "800", color: colors.black, marginRight: 8 },
  levelChip:     { backgroundColor: colors.secondary, height: 28 },
  tags:          { flexWrap: "wrap", marginBottom: 12, gap: 6 },
  tag:           { backgroundColor: "#EEEDF8", borderWidth: 0 },
  card:          { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 14 },
  sectionTitle:  { fontWeight: "700", color: colors.black, marginBottom: 8 },
  btn:           { borderRadius: 10, marginTop: 4, marginBottom: 8 },
  btnContent:    { paddingVertical: 6 },
});

export default CourseDetailScreen;
