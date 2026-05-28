import React, { useState, useCallback } from "react";
import {
    View, StyleSheet, FlatList,
    TouchableOpacity, Alert, RefreshControl,
} from "react-native";
import {
    Text, Icon, Searchbar, Menu, Divider, Avatar,
} from "react-native-paper";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { Header, Loading } from "../../components/common";

// ── Helpers & Meta Configuration ──────────────────────────
const LEVEL_META = {
    beginner:     { label: "Cơ bản",    icon: "signal-cellular-1" },
    intermediate: { label: "Trung cấp", icon: "signal-cellular-2" },
    advanced:     { label: "Nâng cao",  icon: "signal-cellular-3" },
};

// ── Course Card Component ─────────────────────────────────
const CourseCard = ({ course, onEdit, onDelete, onManageMaterial, onManageQuiz, onManageStudents }) => {
    const [menuVisible, setMenuVisible] = useState(false);
    const level = LEVEL_META[course.level] ?? LEVEL_META.beginner;

    return (
        <View style={styles.card}>
            {/* Course Image Thumbnail */}
            <View style={styles.cardThumb}>
                {course.image
                    ? <Avatar.Image size={56} source={{ uri: course.image }} style={styles.thumbImg} />
                    : (
                        <View style={styles.thumbPlaceholder}>
                            <Icon source="book-open-variant" size={28} color="#a5b4fc" />
                        </View>
                    )
                }
            </View>

            {/* Course Information Details */}
            <View style={{ flex: 1 }}>
                <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                        {course.subject ?? course.title ?? course.name ?? "Khóa học chưa có tên"}
                    </Text>

                    <Menu
                        visible={menuVisible}
                        onDismiss={() => setMenuVisible(false)}
                        anchor={
                            <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuDot}>
                                <Icon source="dots-vertical" size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        }
                        contentStyle={styles.menuContent}
                    >
                        <Menu.Item
                            leadingIcon="pencil-outline"
                            onPress={() => { setMenuVisible(false); onEdit(course); }}
                            title="Chỉnh sửa"
                            titleStyle={styles.menuItemTxt}
                        />
                        <Menu.Item
                            leadingIcon="file-document-multiple-outline"
                            onPress={() => { setMenuVisible(false); onManageMaterial(course); }}
                            title="Quản lý tài liệu"
                            titleStyle={styles.menuItemTxt}
                        />
                        <Menu.Item
                            leadingIcon="clipboard-list-outline"
                            onPress={() => { setMenuVisible(false); onManageQuiz(course); }}
                            title="Quản lý Quiz"
                            titleStyle={styles.menuItemTxt}
                        />
                        {/* Student Management Action */}
                        <Menu.Item
                            leadingIcon="account-group-outline"
                            onPress={() => { setMenuVisible(false); onManageStudents(course); }}
                            title="Quản lý học sinh"
                            titleStyle={styles.menuItemTxt}
                        />
                        <Divider />
                        <Menu.Item
                            leadingIcon="trash-can-outline"
                            onPress={() => { setMenuVisible(false); onDelete(course); }}
                            title="Xóa khóa học"
                            titleStyle={[styles.menuItemTxt, { color: "#ef4444" }]}
                        />
                    </Menu>
                </View>

                {/* Badges row */}
                <View style={styles.tagsRow}>
                    <View style={styles.levelBadge}>
                        <Icon source={level.icon} size={12} color="#6366f1" />
                        <Text style={styles.levelTxt}>{level.label}</Text>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Icon source="account-multiple-outline" size={14} color="#64748b" />
                        <Text style={styles.statTxt}>{course.students_count ?? 0} học viên</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity style={styles.qaBtn} onPress={() => onEdit(course)}>
                        <Icon source="pencil" size={14} color="#4f46e5" />
                        <Text style={styles.qaBtnTxt}>Sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.qaBtn, styles.qaBtnGreen]} onPress={() => onManageMaterial(course)}>
                        <Icon source="folder-open-outline" size={14} color="#16a34a" />
                        <Text style={[styles.qaBtnTxt, { color: "#16a34a" }]}>Tài liệu</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.qaBtn, styles.qaBtnAmber]} onPress={() => onManageQuiz(course)}>
                        <Icon source="clipboard-check-outline" size={14} color="#ca8a04" />
                        <Text style={[styles.qaBtnTxt, { color: "#ca8a04" }]}>Quiz</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.qaBtn, styles.qaBtnBlue]} onPress={() => onManageStudents(course)}>
                        <Icon source="account-group-outline" size={14} color="#0284c7" />
                        <Text style={[styles.qaBtnTxt, { color: "#0284c7" }]}>Học sinh</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

// ── Main Screen ───────────────────────────────────────────
const ManageCourseScreen = () => {
    const navigation = useNavigation();

    const [courses,    setCourses]    = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search,     setSearch]     = useState("");

    // Fetch courses from API
    const fetchCourses = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(endpoints["my-courses"]);
            const data = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
            setCourses(data);
        } catch (e) {
            console.error("Fetch courses failed:", e?.response?.data ?? e.message);
            Alert.alert("Lỗi", "Không thể tải danh sách khóa học.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { setLoading(true); fetchCourses(); }, []));
    
    const onRefresh = () => { setRefreshing(true); fetchCourses(); };

    // Delete course handler
    const handleDelete = (course) => {
        Alert.alert(
            "Xóa khóa học",
            `Bạn có chắc muốn xóa "${course.subject ?? course.title ?? course.name}"?\nHành động này không thể hoàn tác.`,
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa", style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem("token");
                            await authApis(token).delete(endpoints["course-detail"](course.id));
                            setCourses(prev => prev.filter(c => c.id !== course.id));
                            Alert.alert("Thành công", "Đã xóa khóa học thành công.");
                        } catch (e) {
                            Alert.alert("Lỗi", "Không thể xóa khóa học.");
                        }
                    },
                },
            ]
        );
    };

    // Navigation handlers
    const handleEdit = (course) => navigation.navigate("CourseForm", { course });

    const handleManageMaterial = (course) => navigation.navigate("ManageMaterial", {
        courseId:    course.id,
        courseTitle: course.subject ?? course.title ?? "Tài liệu",
    });

    const handleManageQuiz = (course) => navigation.navigate("ManageQuiz", {
        courseId:    course.id,
        courseTitle: course.subject ?? course.title ?? course.name ?? "Quiz",
    });

    const handleManageStudents = (course) => navigation.navigate("ManageStudents", {
        courseId:    course.id,
        courseTitle: course.subject ?? course.title ?? course.name ?? "Học sinh",
    });

    // Filter courses based on search query
    const filtered = courses.filter(c => {
        const q = search.trim().toLowerCase();
        const courseName = (c.subject ?? c.title ?? c.name ?? "").toLowerCase();
        const courseDesc = (c.description ?? "").toLowerCase();
        return courseName.includes(q) || courseDesc.includes(q);
    });

    // Render empty state
    const EmptyState = () => (
        <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
                <Icon source="book-plus-outline" size={48} color="#a5b4fc" />
            </View>
            <Text style={styles.emptyTitle}>
                {search ? "Không tìm thấy kết quả" : "Chưa có khóa học nào"}
            </Text>
            <Text style={styles.emptySub}>
                {search
                    ? "Thử thay đổi từ khóa tìm kiếm"
                    : "Bắt đầu tạo khóa học đầu tiên của bạn ngay!"}
            </Text>
            {!search && (
                <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate("CourseForm", {})}>
                    <Icon source="plus" size={18} color="#fff" />
                    <Text style={styles.emptyBtnTxt}>Tạo khóa học</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.screen}>
                <Header title="Khóa học của tôi" showBack />
                <Loading text="Đang tải danh sách khóa học..." />
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <Header
                title="Khóa học của tôi"
                subtitle={`${courses.length} khóa học`}
                showBack
                rightComponent={
                    <TouchableOpacity onPress={() => navigation.navigate("CourseForm", {})} style={{ padding: 8 }}>
                        <Icon source="plus" size={26} color="#fff" />
                    </TouchableOpacity>
                }
            />

            <View style={styles.searchWrap}>
                <Searchbar
                    placeholder="Tìm kiếm khóa học..." value={search} onChangeText={setSearch}
                    style={styles.searchBar} inputStyle={styles.searchInput}
                    iconColor="#4f46e5" clearIcon="close-circle" elevation={0}
                />
            </View>

            {filtered.length > 0 && (
                <View style={styles.countBar}>
                    <Text style={styles.countTxt}>Hiển thị {filtered.length} / {courses.length} khóa học</Text>
                </View>
            )}

            <FlatList
                data={filtered}
                keyExtractor={item => String(item.id)}
                renderItem={({ item }) => (
                    <CourseCard
                        course={item}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onManageMaterial={handleManageMaterial}
                        onManageQuiz={handleManageQuiz}
                        onManageStudents={handleManageStudents}
                    />
                )}
                contentContainerStyle={[styles.list, filtered.length === 0 && { flex: 1 }]}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                ListEmptyComponent={<EmptyState />}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" colors={["#4f46e5"]} />
                }
            />

            {filtered.length > 0 && (
                <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("CourseForm", {})}>
                    <Icon source="plus" size={26} color="#fff" />
                </TouchableOpacity>
            )}
        </View>
    );
};

export default ManageCourseScreen;

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
    screen:       { flex: 1, backgroundColor: "#f8fafc" },
    searchWrap:   { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
    searchBar:    { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", height: 48 },
    searchInput:  { fontSize: 14, color: "#0f172a" },
    countBar:     { paddingHorizontal: 20, paddingBottom: 6 },
    countTxt:     { fontSize: 12, color: "#94a3b8", fontStyle: "italic" },
    list:         { padding: 16, paddingBottom: 100 },

    card:             { backgroundColor: "#fff", borderRadius: 18, padding: 14, flexDirection: "row", gap: 12, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
    cardThumb:        { justifyContent: "flex-start", paddingTop: 2 },
    thumbImg:         { borderRadius: 14 },
    thumbPlaceholder: { width: 56, height: 56, borderRadius: 14, backgroundColor: "#ede9fe", justifyContent: "center", alignItems: "center" },
    cardTitleRow:     { flexDirection: "row", alignItems: "flex-start", gap: 4 },
    cardTitle:        { flex: 1, fontSize: 14, fontWeight: "700", color: "#0f172a", lineHeight: 20 },
    menuDot:          { padding: 2, marginTop: -2 },
    menuContent:      { backgroundColor: "#fff", borderRadius: 14, elevation: 8 },
    menuItemTxt:      { fontSize: 14, color: "#0f172a" },

    tagsRow:     { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
    levelBadge:  { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: "#f1f5f9", borderRadius: 20 },
    levelTxt:    { fontSize: 11, color: "#6366f1", fontWeight: "600" },

    statsRow: { flexDirection: "row", gap: 14, marginTop: 6 },
    statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    statTxt:  { fontSize: 12, color: "#64748b" },

    quickActions: { flexDirection: "row", gap: 6, marginTop: 10, flexWrap: "wrap" },
    qaBtn:        { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: "#ede9fe" },
    qaBtnGreen:   { backgroundColor: "#dcfce7" },
    qaBtnAmber:   { backgroundColor: "#fef9c3" },
    qaBtnBlue:    { backgroundColor: "#e0f2fe" }, 
    qaBtnTxt:     { fontSize: 11, fontWeight: "700", color: "#4f46e5" },

    emptyWrap:    { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32, paddingVertical: 60 },
    emptyIconWrap:{ width: 90, height: 90, borderRadius: 26, backgroundColor: "#ede9fe", justifyContent: "center", alignItems: "center", marginBottom: 20 },
    emptyTitle:   { fontSize: 17, fontWeight: "800", color: "#0f172a", marginBottom: 8, textAlign: "center" },
    emptySub:     { fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 20, marginBottom: 24 },
    emptyBtn:     { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#4f46e5", paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14, elevation: 4, shadowColor: "#4f46e5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    emptyBtnTxt:  { color: "#fff", fontWeight: "800", fontSize: 14 },
    fab:          { position: "absolute", right: 20, bottom: 28, width: 58, height: 58, borderRadius: 18, backgroundColor: "#4f46e5", justifyContent: "center", alignItems: "center", elevation: 8, shadowColor: "#4f46e5", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
});
