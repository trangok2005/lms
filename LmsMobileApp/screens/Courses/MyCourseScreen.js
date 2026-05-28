import React, { useCallback, useState } from "react";
import { FlatList, View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Text, Chip, Icon, Surface } from "react-native-paper";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import Styles, { colors } from "../../styles/Styles";
import { Header, Loading } from "../../components/common";
import { ProgressBar } from "../../components/courses";

const STATUS_CONFIG = {
  active:    { label: "Đang học",  color: colors.primary  },
  completed: { label: "Hoàn thành",color: "#F59E0B"       },
  dropped:   { label: "Đã bỏ",    color: colors.danger   },
};

const STATUS_FILTERS = [
  { label: "Tất cả",     value: "" },
  { label: "Đang học",   value: "active" },
  { label: "Hoàn thành", value: "completed" },
  { label: "Đã bỏ",     value: "dropped" },
];

const MyCourseScreen = () => {
  const nav = useNavigation();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [status, setStatus]           = useState("");

  useFocusEffect(
    useCallback(() => {
      const fetch = async () => {
        try {
          setLoading(true);
          const token = await AsyncStorage.getItem("token");
          const res   = await authApis(token).get(endpoints["my-courses"], {
            params: status ? { status } : {},
          });
          setEnrollments(res.data.results ?? res.data);
        } catch (ex) {
          console.debug(ex);
        } finally {
          setLoading(false);
        }
      };
      fetch();
    }, [status])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Khoá học của tôi" />

      {/* Filter */}
      <FlatList
        data={STATUS_FILTERS}
        horizontal
        keyExtractor={(i) => i.value}
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        renderItem={({ item }) => (
          <Chip
            selected={status === item.value}
            onPress={() => setStatus(item.value)}
            style={[styles.chip, status === item.value && styles.chipActive]}
            textStyle={{ color: status === item.value ? colors.white : colors.gray, fontSize: 13 }}
          >
            {item.label}
          </Chip>
        )}
      />

      {loading ? (
        <Loading text="Đang tải khoá học..." />
      ) : (
        <FlatList
          data={enrollments}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={[Styles.center, { marginTop: 60 }]}>
              <Icon source="book-off" size={48} color={colors.border} />
              <Text variant="bodyLarge" style={{ color: colors.gray, marginTop: 12 }}>
                Chưa có khoá học nào
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            console.log("Enrollment item:", item),
            <EnrollmentCard
              enrollment={item}
              onPress={() => 
                nav.navigate("HomeTab", { 
                  screen: "MaterialList", 
                  params: { courseId:  item.course?.id }
                })
              }
            />
          )}
        />
      )}
    </View>
  );
};


const EnrollmentCard = ({ enrollment, onPress }) => {
  const st = STATUS_CONFIG[enrollment.status] ?? STATUS_CONFIG.active;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={Styles.mb10}>
      <Surface style={styles.card} elevation={1}>
        <View style={Styles.row}>
          {/* Thumbnail nhỏ */}
          {enrollment.course_image ? (
            <Image source={{ uri: enrollment.course.image }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbFallback]}>
              <Icon source="book" size={28} color={colors.white} />
            </View>
          )}

          {/* Nội dung */}
          <View style={styles.content}>
            <View style={[Styles.between, Styles.mb10]}>
              <Text variant="titleSmall" style={styles.courseTitle} numberOfLines={2}>
                {enrollment.course.subject ?? "Khoá học"}
              </Text>
            </View>

            {/* Progress bar */}
            <ProgressBar percent={enrollment.progress_percent ?? 0} />

            {/* Truy cập lần cuối */}
            {enrollment.last_accessed && (
              <View style={[Styles.row, { marginTop: 6 }]}>
                <Icon source="clock-outline" size={13} color={colors.gray} />
                <Text variant="bodySmall" style={{ marginLeft: 4, color: colors.gray }}>
                   {new Date(enrollment.last_accessed).toLocaleDateString("vi-VN")}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  filterRow:    {
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexGrow: 0,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chip:         { marginRight: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  chipActive:   { backgroundColor: colors.primary, borderColor: colors.primary },
  list:         { padding: 15, paddingBottom: 30 },
  card:         { backgroundColor: colors.white, borderRadius: 12, padding: 12 },
  thumb:        { width: 72, height: 72, borderRadius: 8, marginRight: 12 },
  thumbFallback:{ backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" },
  content:      { flex: 1 },
  courseTitle:  { flex: 1, fontWeight: "700", color: colors.black, marginRight: 8, lineHeight: 18 },
  statusChip:   { backgroundColor: "transparent", borderWidth: 1, height: 22 },
});

export default MyCourseScreen;
