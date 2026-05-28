import React, { useState, useEffect } from "react";
import { ActivityIndicator, FlatList, View, ScrollView, StyleSheet } from "react-native";
import { Searchbar, Text, Chip, Icon } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import Apis, { endpoints } from "../../configs/Apis";
import Styles, { colors } from "../../styles/Styles";
import { Header, Loading } from "../../components/common";
import { CourseCard } from "../../components/courses";

const LEVELS = [
  { label: "Tất cả",     value: null },
  { label: "Dễ",         value: "beginner" },
  { label: "Trung bình", value: "intermediate" },
  { label: "Nâng cao",   value: "advanced" },
];

const CourseSearchScreen = () => {
  const nav = useNavigation();

  const [keyword,       setKeyword]       = useState("");
  const [categories,    setCategories]    = useState([]);
  const [tags,          setTags]          = useState([]);
  const [selectedCate,  setSelectedCate]  = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedTag,   setSelectedTag]   = useState(null);
  const [courses,       setCourses]       = useState([]);
  const [loading,       setLoading]       = useState(false);


  const [page, setPage] = useState(1);


  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [cateRes, tagRes] = await Promise.all([
          Apis.get(endpoints["categories"]),
          Apis.get(endpoints["tags"]),
        ]);
        setCategories(cateRes.data.results ?? cateRes.data);
        setTags(tagRes.data.results ?? tagRes.data);
      } catch (ex) {
        console.debug(ex);
      }
    };
    fetchMeta();
  }, []);


  const loadCourses = async () => {
    if (page === 0) return;
    try {
      setLoading(true);

      let url = `${endpoints["courses"]}?page=${page}&ordering=-id`;
      if (keyword.trim())          url += `&keyword=${keyword.trim()}`;
      if (selectedCate)            url += `&category=${selectedCate.id}`;
      if (selectedLevel?.value)    url += `&level=${selectedLevel.value}`;
      if (selectedTag)             url += `&tag=${selectedTag.id}`;

      const res = await Apis.get(url);


      if (res.data.next === null) setPage(0);

      if (page === 1)
        setCourses(res.data.results ?? res.data);
      else
        setCourses(prev => [...prev, ...(res.data.results ?? res.data)]);

    } catch (ex) {
      console.debug(ex);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const timer = setTimeout(() => {
      if (page > 0) loadCourses();
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword, selectedCate, selectedLevel, selectedTag, page]);


  useEffect(() => {
    setPage(1);
  }, [keyword, selectedCate, selectedLevel, selectedTag]);

  const loadMore = () => {
    if (page > 0 && !loading) setPage(page + 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Tìm kiếm khoá học" showBack />

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Searchbar
          placeholder="Nhập tên khoá học, hoặc từ khoá liên quan..."
          value={keyword}
          onChangeText={setKeyword}
          style={styles.searchBar}
          inputStyle={{ color: colors.black }}
          autoFocus
        />
      </View>

      {/* Filter */}
      <View style={styles.filterSection}>
        <Text variant="labelMedium" style={styles.filterLabel}>Danh mục</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Chip selected={selectedCate === null} onPress={() => setSelectedCate(null)}
            style={styles.chip} selectedColor={colors.white} showSelectedOverlay
            theme={{ colors: { primary: colors.primary } }}>
            Tất cả
          </Chip>
          {categories.filter(c => c).map((c) => (
            <Chip key={c.id}
              selected={selectedCate?.id === c.id}
              onPress={() => setSelectedCate(selectedCate?.id === c.id ? null : c)}
              style={styles.chip} selectedColor={colors.white} showSelectedOverlay
              theme={{ colors: { primary: colors.primary } }}>
              {c?.name}
            </Chip>
          ))}
        </ScrollView>

        <Text variant="labelMedium" style={[styles.filterLabel, { marginTop: 8 }]}>Trình độ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {LEVELS.map((l) => (
            <Chip key={l.label}
              selected={l.value === null ? selectedLevel === null : selectedLevel?.value === l.value}
              onPress={() => setSelectedLevel(l.value === null ? null : l)}
              style={styles.chip} selectedColor={colors.white} showSelectedOverlay
              theme={{ colors: { primary: colors.primary } }}>
              {l.label}
            </Chip>
          ))}
        </ScrollView>

        <Text variant="labelMedium" style={[styles.filterLabel, { marginTop: 8 }]}>Nhãn</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Chip selected={selectedTag === null} onPress={() => setSelectedTag(null)}
            style={styles.chip} selectedColor={colors.white} showSelectedOverlay
            theme={{ colors: { primary: colors.primary } }}>
            Tất cả
          </Chip>
          {tags.filter(t => t).map((t) => (
            <Chip key={t.id}
              selected={selectedTag?.id === t.id}
              onPress={() => setSelectedTag(selectedTag?.id === t.id ? null : t)}
              style={styles.chip} selectedColor={colors.white} showSelectedOverlay
              theme={{ colors: { primary: colors.primary } }}>
              {t?.name}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Kết quả */}
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}

        ListFooterComponent={
          loading
            ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
            : page === 0 && courses.length > 0
              ? <Text style={styles.endText}>Đã hiển thị tất cả</Text>
              : null
        }
        ListHeaderComponent={
          courses.length > 0
            ? <Text variant="labelMedium" style={styles.resultCount}>{courses.length} kết quả</Text>
            : null
        }
        ListEmptyComponent={
          !loading && (
            <View style={[Styles.center, { marginTop: 60 }]}>
              <Icon source="magnify" size={40} color={colors.gray} />
              <Text variant="bodyMedium" style={{ color: colors.gray, marginTop: 8 }}>
                {keyword || selectedCate || selectedLevel || selectedTag
                  ? "Không tìm thấy khoá học phù hợp"
                  : "Nhập từ khoá hoặc chọn bộ lọc để tìm kiếm"}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <CourseCard
            course={item}
            onPress={() => nav.navigate("CourseDetail", { courseId: item.id })}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  searchWrap:    { padding: 15, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchBar:     { backgroundColor: colors.bg, borderRadius: 10, elevation: 0, borderWidth: 1, borderColor: colors.border },
  filterSection: { paddingHorizontal: 15, paddingTop: 12, paddingBottom: 8, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterLabel:   { fontWeight: "700", color: colors.black, marginBottom: 5 },
  chipRow:       { gap: 8, paddingVertical: 2 },
  chip:          { marginRight: 2, borderRadius: 20 },
  list:          { padding: 15, paddingBottom: 30 },
  resultCount:   { color: colors.gray, marginBottom: 10 },
  endText:       { textAlign: "center", color: colors.gray, fontSize: 12, paddingVertical: 15 },
});

export default CourseSearchScreen;