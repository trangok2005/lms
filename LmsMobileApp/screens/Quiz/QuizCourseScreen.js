import React, { useState, useCallback } from "react";
import { View, FlatList, StyleSheet, RefreshControl } from "react-native";
import { Text, Icon, Searchbar } from "react-native-paper";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { Header, Loading } from "../../components/common";
import QuizzCard from "../../components/quiz/Quizzcard";

const QuizCourseScreen = () => {
    const navigation = useNavigation();

    const [courses, setCourses]         = useState([]);
    const [filtered, setFiltered]       = useState([]);
    const [loading, setLoading]         = useState(true);
    const [refreshing, setRefreshing]   = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchCourses = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const token = await AsyncStorage.getItem("token");
            const res   = await authApis(token).get(endpoints["my-courses"]);
            const raw   = res.data.results ?? res.data;
            const list  = Array.isArray(raw) ? raw : [];

            const data = list.map(item => ({
                ...(item.course ?? item),
               progress: Number((item.progress_percent ?? 0).toFixed(2)),
                enrollment_status: item.status ?? null,
            }));

            setCourses(data);
            applySearch(data, searchQuery);
        } catch (ex) {
            console.error("Fetch courses error:", ex?.response?.data ?? ex);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchCourses(); }, []));

    const applySearch = (data, query) => {
        if (!query.trim()) { setFiltered(data); return; }
        const q = query.toLowerCase();
        setFiltered(
            data.filter(c =>
                (c.subject ?? c.title ?? c.name ?? "").toLowerCase().includes(q)
            )
        );
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        applySearch(courses, query);
    };

    if (loading) return <Loading text="Đang tải khóa học..." />;

    return (
        <View style={styles.screen}>
            <Header title="Bài kiểm tra" showBack />

            <View style={styles.searchWrapper}>
                <Searchbar
                    placeholder="Tìm khóa học..."
                    value={searchQuery}
                    onChangeText={handleSearch}
                    style={styles.searchbar}
                    iconColor="#4f46e5"
                />
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <QuizzCard
                        course={item}
                        onPress={(course) =>
                            navigation.navigate("QuizList", {
                                courseId:    course.id,
                                courseTitle: course.subject ?? course.title ?? course.name,
                            })
                        }
                    />
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchCourses(true)}
                        tintColor="#4f46e5"
                    />
                }
                ListHeaderComponent={
                    courses.length > 0 && (
                        <Text style={styles.hint}>
                            {filtered.length} khóa học có bài kiểm tra
                        </Text>
                    )
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Icon source="clipboard-text-off-outline" size={56} color="#cbd5e1" />
                        <Text style={styles.emptyText}>
                            {searchQuery ? "Không tìm thấy khóa học." : "Bạn chưa đăng ký khóa học nào."}
                        </Text>
                        {!searchQuery && (
                            <Text style={styles.emptySubText}>
                                Hãy đăng ký khóa học để làm bài kiểm tra.
                            </Text>
                        )}
                    </View>
                }
            />
        </View>
    );
};

export default QuizCourseScreen;

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f8fafc" },
    searchWrapper: {
        paddingHorizontal: 16, paddingVertical: 10,
        backgroundColor: "#fff",
        borderBottomWidth: 1, borderBottomColor: "#e2e8f0",
    },
    searchbar: { backgroundColor: "#f1f5f9", borderRadius: 12, elevation: 0 },
    list:      { padding: 16, paddingBottom: 40 },
    hint:      { fontSize: 13, color: "#94a3b8", marginBottom: 12, fontWeight: "500" },
    empty:     { alignItems: "center", marginTop: 80, gap: 10, paddingHorizontal: 32 },
    emptyText:    { fontSize: 16, color: "#94a3b8", fontWeight: "600", textAlign: "center" },
    emptySubText: { fontSize: 13, color: "#cbd5e1", textAlign: "center" },
});
