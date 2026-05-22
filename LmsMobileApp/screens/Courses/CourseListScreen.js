import React, { useCallback, useState } from "react";
import { FlatList, View, StyleSheet } from "react-native";
import { Chip } from "react-native-paper";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Apis, { endpoints } from "../../configs/Apis";
import Styles, { colors } from "../../styles/Styles";
import { Header, Loading } from "../../components/common";
import { CourseCard } from "../../components/courses";

const LEVELS = [
  { label: "Tất cả",     value: "" },
  { label: "Dễ",         value: "beginner" },
  { label: "Trung bình", value: "intermediate" },
  { label: "Nâng cao",   value: "advanced" },
];

const CourseListScreen = () => {
  const nav = useNavigation();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel]     = useState("");
  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchCourses = async (reset = false) => {
    if (!hasMore && !reset) return;
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      const res = await Apis.get(endpoints["courses"], {
        params: { level, page: currentPage },
      });
      const results = res.data.results ?? res.data;
      setCourses((prev) => reset ? results : [...prev, ...results]);
      setHasMore(!!res.data.next);
      setPage(currentPage + 1);
    } catch (ex) {
      console.debug(ex);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setPage(1);
      setHasMore(true);
      fetchCourses(true);
    }, [level])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title="Khóa học"
        showSearch
        onSearch={() => nav.navigate("CourseSearch")}
      />

      {/* Filter level */}
      <FlatList
        data={LEVELS}
        horizontal
        keyExtractor={(i) => i.value}
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        renderItem={({ item }) => (
          <Chip
            selected={level === item.value}
            onPress={() => setLevel(item.value)}
            style={[styles.chip, level === item.value && styles.chipActive]}
            textStyle={{ color: level === item.value ? colors.white : colors.gray, fontSize: 13 }}
          >
            {item.label}
          </Chip>
        )}
      />

      {/* Danh sách */}
      {loading && courses.length === 0 ? (
        <Loading text="Đang tải khoá học..." />
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={() => fetchCourses()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loading ? <Loading /> : null}
          ListEmptyComponent={
            <View style={[Styles.center, { marginTop: 60 }]}>
              <Loading text="Không có khoá học nào." />
            </View>
          }
          renderItem={({ item }) => (
            <CourseCard
              course={item}
              onPress={() => nav.navigate("CourseDetail", { courseId: item.id })}
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  filterRow: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexGrow: 0,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chip: {
    marginRight: 8,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  list: { padding: 15, paddingBottom: 30 },
});

export default CourseListScreen;
