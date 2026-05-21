import React, { useState, useCallback, useEffect } from "react";
import { FlatList, View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Searchbar, Text, Chip, Icon } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import Apis, { endpoints } from "../../configs/Apis";
import Styles, { colors } from "../../styles/Styles";
import { Header, Loading } from "../../components/common";
import { CourseCard } from "../../components/courses";

/** Trình độ fix cứng (label hiển thị tiếng Việt, value gửi lên BE tiếng Anh) */
const LEVELS = [
  { label: "Tất cả", value: null },
  { label: "Dễ",       value: "beginner" },
  { label: "Trung bình", value: "intermediate" },
  { label: "Nâng cao",  value: "advanced" },
];

const CourseSearchScreen = () => {
  const nav = useNavigation();

  // ── Keyword ──
  const [keyword, setKeyword] = useState("");

  // ── Filter metadata (lấy từ BE) ──
  const [categories, setCategories] = useState([]);
  const [tags, setTags]             = useState([]);

  // ── Filter state ──
  const [selectedCate,  setSelectedCate]  = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedTag,   setSelectedTag]   = useState(null);

  // ── Kết quả ──
  const [courses,  setCourses]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);

  // ── Load danh mục & nhãn 1 lần khi mount ──
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
        console.error("Lỗi nạp metadata:", ex);
      }
    };
    fetchMeta();
  }, []);

  /**
   * Thực hiện tìm kiếm.
   * Gọi lại mỗi khi filter thay đổi (qua useEffect bên dưới)
   * hoặc khi user submit keyword.
   */
  const search = useCallback(async (kw = keyword) => {
    try {
      setLoading(true);
      setSearched(true);

      const params = { page: 1 };
      if (kw.trim())                              params.keyword  = kw.trim();
      if (selectedCate)                           params.category = selectedCate.id;
      if (selectedLevel && selectedLevel.value)   params.level    = selectedLevel.value;
      if (selectedTag)                            params.tag      = selectedTag.id;

      const res = await Apis.get(endpoints["courses"], { params });
      setCourses(res.data.results ?? res.data);
    } catch (ex) {
      console.error("Lỗi tìm kiếm:", ex);
    } finally {
      setLoading(false);
    }
  }, [keyword, selectedCate, selectedLevel, selectedTag]);

  // Tự động tìm lại khi filter thay đổi (chỉ khi đã từng search hoặc có filter)
  useEffect(() => {
    if (searched || selectedCate || selectedLevel || selectedTag) {
      search(keyword);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCate, selectedLevel, selectedTag]);

  const activeFilterCount = [selectedCate, selectedLevel, selectedTag].filter(Boolean).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Tìm kiếm khoá học" showBack />

      {/* ── Thanh tìm kiếm ── */}
      <View style={styles.searchWrap}>
        <Searchbar
          placeholder="Nhập tên khoá học, giảng viên..."
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={() => search()}
          onIconPress={() => search()}
          style={styles.searchBar}
          inputStyle={{ color: colors.black }}
          autoFocus
        />
      </View>

      {/* ── Bộ lọc ── */}
      <View style={styles.filterSection}>

        {/* Danh mục */}
        <Text variant="labelMedium" style={styles.filterLabel}>Danh mục</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Chip
            selected={selectedCate === null}
            onPress={() => setSelectedCate(null)}
            style={styles.chip}
            selectedColor={colors.white}
            showSelectedOverlay
            theme={{ colors: { primary: colors.primary } }}
          >
            Tất cả
          </Chip>
          {categories.map((c) => (
            <Chip
              key={`cate-${c.id}`}
              selected={selectedCate?.id === c.id}
              onPress={() => setSelectedCate(selectedCate?.id === c.id ? null : c)}
              style={styles.chip}
              selectedColor={colors.white}
              showSelectedOverlay
              theme={{ colors: { primary: colors.primary } }}
            >
              {c.name}
            </Chip>
          ))}
        </ScrollView>

        {/* Trình độ */}
        <Text variant="labelMedium" style={[styles.filterLabel, { marginTop: 8 }]}>Trình độ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {LEVELS.map((l) => (
            <Chip
              key={`level-${l.label}`}
              selected={
                l.value === null
                  ? selectedLevel === null
                  : selectedLevel?.value === l.value
              }
              onPress={() => setSelectedLevel(l.value === null ? null : l)}
              style={styles.chip}
              selectedColor={colors.white}
              showSelectedOverlay
              theme={{ colors: { primary: colors.primary } }}
            >
              {l.label}
            </Chip>
          ))}
        </ScrollView>

        {/* Nhãn xu hướng */}
        <Text variant="labelMedium" style={[styles.filterLabel, { marginTop: 8 }]}>Nhãn</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Chip
            selected={selectedTag === null}
            onPress={() => setSelectedTag(null)}
            style={styles.chip}
            selectedColor={colors.white}
            showSelectedOverlay
            theme={{ colors: { primary: colors.primary } }}
          >
            Tất cả
          </Chip>
          {tags.map((t) => (
            <Chip
              key={`tag-${t.id}`}
              selected={selectedTag?.id === t.id}
              onPress={() => setSelectedTag(selectedTag?.id === t.id ? null : t)}
              style={styles.chip}
              selectedColor={colors.white}
              showSelectedOverlay
              theme={{ colors: { primary: colors.primary } }}
            >
              {t.name}
            </Chip>
          ))}
        </ScrollView>

        {/* Nút reset filter nếu đang có filter */}
        {activeFilterCount > 0 && (
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => {
              setSelectedCate(null);
              setSelectedLevel(null);
              setSelectedTag(null);
            }}
          >
            <Icon source="filter-remove-outline" size={14} color={colors.primary} />
            <Text style={styles.resetText}>Xoá bộ lọc ({activeFilterCount})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Kết quả ── */}
      {loading ? (
        <Loading text="Đang tìm kiếm..." />
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            searched && courses.length > 0 ? (
              <Text variant="labelMedium" style={styles.resultCount}>
                {courses.length} kết quả
              </Text>
            ) : null
          }
          ListEmptyComponent={
            searched ? (
              <View style={[Styles.center, { marginTop: 60 }]}>
                <Icon source="magnify-close" size={40} color={colors.gray} />
                <Text variant="bodyLarge" style={{ color: colors.gray, marginTop: 8 }}>
                  Không tìm thấy kết quả
                </Text>
                {keyword.trim() !== "" && (
                  <Text variant="bodySmall" style={{ color: colors.gray, marginTop: 4 }}>
                    cho "{keyword}"
                  </Text>
                )}
              </View>
            ) : (
              <View style={[Styles.center, { marginTop: 60 }]}>
                <Icon source="magnify" size={40} color={colors.gray} />
                <Text variant="bodyMedium" style={{ color: colors.gray, marginTop: 8 }}>
                  Nhập từ khoá hoặc chọn bộ lọc để tìm khoá học
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchWrap: {
    padding: 15,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    backgroundColor: colors.bg,
    borderRadius: 10,
    elevation: 0,
    borderWidth: 1,
    borderColor: colors.border,
  },

  filterSection: {
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterLabel: {
    fontWeight: "700",
    color: colors.black,
    marginBottom: 5,
  },
  chipRow: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    marginRight: 2,
    borderRadius: 20,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 8,
    gap: 4,
  },
  resetText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },

  list:        { padding: 15, paddingBottom: 30 },
  resultCount: { color: colors.gray, marginBottom: 10 },
});

export default CourseSearchScreen;
