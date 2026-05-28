import React, { useState, useCallback } from "react";
import { View, FlatList, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Text, Icon, Chip, Searchbar, Divider, Button } from "react-native-paper";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { authApis, endpoints } from "../../configs/Apis";
import { Header, Loading } from "../../components/common";

const getScoreColor = (pct) => {
    if (pct >= 80) return { bg: "#dcfce7", text: "#16a34a" };
    if (pct >= 50) return { bg: "#fef9c3", text: "#ca8a04" };
    return { bg: "#fee2e2", text: "#dc2626" };
};

const ManageStudentsScreen = () => {
    const route = useRoute();
    const { courseId, courseTitle } = route.params ?? {};

    const [students, setStudents]   = useState([]);
    const [filtered, setFiltered]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState("");

    const [quizzes, setQuizzes]           = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [filterModal, setFilterModal]   = useState(false);


    const fetchQuizzes = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const url = endpoints["teacher-quiz-by-course"](courseId);
            const res = await authApis(token).get(url);
            
            const list = res.data.results ?? res.data;
            setQuizzes(Array.isArray(list) ? list : []);
        } catch (ex) {
            console.error("Fetch quizzes error:", ex);
        }
    };


    const fetchStudents = async (quizId = null) => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            const url = endpoints["teacher-student-list"]();


            const res = await authApis(token).get(url, {
                params: {
                    course: courseId,
                    quiz: quizId
                }
            });

            const list = res.data.results ?? res.data;
            const data = Array.isArray(list) ? list : [];
            
            setStudents(data);
            setFiltered(data);
            setSearch("");
        } catch (ex) {
            console.error("Fetch students error:", ex);
        } finally {
            setLoading(false);
        }
    };


    useFocusEffect(
        useCallback(() => {
            if (courseId) {
                fetchQuizzes();
                fetchStudents();
            } else {
                setLoading(false);
                console.warn("Missing courseId in navigation params");
            }
        }, [courseId])
    );


    const handleSearch = (text) => {
        setSearch(text);
        if (!text.trim()) {
            setFiltered(students);
            return;
        }
        const lowerText = text.toLowerCase();
        const result = students.filter(
            (s) => s.full_name?.toLowerCase().includes(lowerText) || 
                   s.email?.toLowerCase().includes(lowerText)
        );
        setFiltered(result);
    };


    const applyQuizFilter = (quiz) => {
        setSelectedQuiz(quiz);
        setFilterModal(false);
        fetchStudents(quiz ? quiz.id : null);
    };


    const stats = React.useMemo(() => {
        if (!students.length) return null;
        const total    = students.length;
        const avgScore = students.reduce((s, u) => s + (u.avg_score ?? 0), 0) / total;
        const active   = students.filter((u) => u.total_quizzes_done > 0).length;
        return { total, avgScore, active };
    }, [students]);


    const renderStats = () => {
        if (!stats) return null;
        return (
            <View style={styles.statsCard}>
                <View style={styles.statBox}>
                    <Text style={styles.statNum}>{stats.total}</Text>
                    <Text style={styles.statLbl}>Học viên</Text>
                </View>
                <View style={[styles.statBox, styles.statBorder]}>
                    <Text style={[styles.statNum, { color: "#4f46e5" }]}>{stats.active}</Text>
                    <Text style={styles.statLbl}>Đã làm quiz</Text>
                </View>
                <View style={[styles.statBox, styles.statBorder]}>
                    <Text style={[styles.statNum, { color: "#ca8a04" }]}>
                        {stats.avgScore.toFixed(1)}%
                    </Text>
                    <Text style={styles.statLbl}>TB điểm</Text>
                </View>
            </View>
        );
    };


    const renderFilterModal = () => (
        <Modal
            visible={filterModal}
            transparent
            animationType="slide"
            onRequestClose={() => setFilterModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                    <Text style={styles.modalTitle}>Lọc theo Quiz</Text>
                    <Divider style={{ marginBottom: 12 }} />

                    <TouchableOpacity
                        style={[styles.quizOption, !selectedQuiz && styles.quizOptionActive]}
                        onPress={() => applyQuizFilter(null)}
                    >
                        <Icon source="view-list-outline" size={18} color={!selectedQuiz ? "#4f46e5" : "#64748b"} />
                        <Text style={[styles.quizOptionText, !selectedQuiz && { color: "#4f46e5", fontWeight: "700" }]}>
                            Tất cả học viên
                        </Text>
                        {!selectedQuiz && <Icon source="check" size={16} color="#4f46e5" />}
                    </TouchableOpacity>

                    {quizzes.map((q) => (
                        <TouchableOpacity
                            key={q.id}
                            style={[styles.quizOption, selectedQuiz?.id === q.id && styles.quizOptionActive]}
                            onPress={() => applyQuizFilter(q)}
                        >
                            <Icon
                                source="clipboard-text-outline" size={18}
                                color={selectedQuiz?.id === q.id ? "#4f46e5" : "#64748b"}
                            />
                            <Text
                                style={[styles.quizOptionText, selectedQuiz?.id === q.id && { color: "#4f46e5", fontWeight: "700" }]}
                                numberOfLines={1}
                            >
                                {q.title}
                            </Text>
                            {selectedQuiz?.id === q.id && <Icon source="check" size={16} color="#4f46e5" />}
                        </TouchableOpacity>
                    ))}

                    <Button mode="outlined" onPress={() => setFilterModal(false)} style={{ marginTop: 16 }} textColor="#64748b">
                        Đóng
                    </Button>
                </View>
            </View>
        </Modal>
    );


    const renderItem = ({ item }) => {
        const color = getScoreColor(item.avg_score ?? 0);
        return (
            <View style={styles.card}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {(item.full_name ?? "?")[0].toUpperCase()}
                    </Text>
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.name} numberOfLines={1}>{item.full_name}</Text>
                    <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
                    {item.enrolled_courses?.length > 0 && (
                        <Text style={styles.courses} numberOfLines={1}>
                            📚 {item.enrolled_courses.join(", ")}
                        </Text>
                    )}
                    <View style={styles.metaRow}>
                        <Icon source="clipboard-check-outline" size={12} color="#94a3b8" />
                        <Text style={styles.metaText}>{item.total_quizzes_done} bài đã làm</Text>
                        <Text style={styles.metaDot}>·</Text>
                        <Icon source="trophy-outline" size={12} color="#94a3b8" />
                        <Text style={styles.metaText}>Đạt {item.pass_rate}%</Text>
                    </View>
                </View>
                <View style={styles.scoreCol}>
                    <View style={[styles.scoreBadge, { backgroundColor: color.bg }]}>
                        <Text style={[styles.scoreText, { color: color.text }]}>
                            {(item.avg_score ?? 0).toFixed(0)}%
                        </Text>
                    </View>
                    <Text style={styles.scoreLbl}>TB</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.screen}>
            <Header
                title="Quản lý học viên"
                subtitle={courseTitle ?? ""}
                showBack
            />

            {loading ? (
                <Loading text="Đang tải danh sách học viên..." />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    renderItem={renderItem}
                    ListHeaderComponent={
                        <>
                            {renderStats()}
                            <View style={styles.searchRow}>
                                <Searchbar
                                    placeholder="Tìm theo tên, email..."
                                    value={search}
                                    onChangeText={handleSearch}
                                    style={styles.searchbar}
                                    inputStyle={{ fontSize: 13 }}
                                    iconColor="#94a3b8"
                                />
                                <TouchableOpacity
                                    style={[styles.filterBtn, selectedQuiz && styles.filterBtnActive]}
                                    onPress={() => setFilterModal(true)}
                                >
                                    <Icon
                                        source="filter-variant"
                                        size={20}
                                        color={selectedQuiz ? "#fff" : "#4f46e5"}
                                    />
                                </TouchableOpacity>
                            </View>

                            {selectedQuiz && (
                                <Chip
                                    style={styles.activeChip}
                                    textStyle={{ color: "#4f46e5", fontSize: 12 }}
                                    onClose={() => applyQuizFilter(null)}
                                    icon="clipboard-text-outline"
                                >
                                    {selectedQuiz.title}
                                </Chip>
                            )}

                            <Text style={styles.hint}>{filtered.length} học viên</Text>
                        </>
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Icon source="account-off-outline" size={52} color="#cbd5e1" />
                            <Text style={styles.emptyText}>Chưa có học viên nào.</Text>
                        </View>
                    }
                    ItemSeparatorComponent={() => <Divider style={{ marginHorizontal: 4 }} />}
                />
            )}

            {renderFilterModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f8fafc" },
    list:   { padding: 16, paddingBottom: 40 },
    hint:   { fontSize: 13, color: "#94a3b8", marginBottom: 8, fontWeight: "500" },

    statsCard: {
        flexDirection: "row", backgroundColor: "#fff",
        borderRadius: 16, padding: 16, marginBottom: 14,
        elevation: 2, shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
    },
    statBox:    { flex: 1, alignItems: "center", gap: 4 },
    statBorder: { borderLeftWidth: 1, borderColor: "#e2e8f0" },
    statNum:    { fontSize: 22, fontWeight: "800", color: "#0f172a" },
    statLbl:    { fontSize: 11, color: "#94a3b8", fontWeight: "500" },

    searchRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
    searchbar: { flex: 1, backgroundColor: "#fff", borderRadius: 12, elevation: 1, height: 44 },
    filterBtn: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: "#ede9fe", justifyContent: "center", alignItems: "center",
    },
    filterBtnActive: { backgroundColor: "#4f46e5" },
    activeChip: { backgroundColor: "#ede9fe", alignSelf: "flex-start", marginBottom: 10, borderRadius: 8 },

    card: {
        flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
        borderRadius: 14, padding: 12, gap: 12, marginBottom: 8,
        elevation: 1, shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3,
    },
    avatar:     { width: 44, height: 44, borderRadius: 14, backgroundColor: "#ede9fe", justifyContent: "center", alignItems: "center" },
    avatarText: { fontSize: 18, fontWeight: "800", color: "#4f46e5" },
    name:       { fontSize: 14, fontWeight: "700", color: "#0f172a" },
    email:      { fontSize: 12, color: "#64748b" },
    courses:    { fontSize: 11, color: "#94a3b8" },
    metaRow:    { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
    metaText:   { fontSize: 11, color: "#94a3b8" },
    metaDot:    { fontSize: 11, color: "#cbd5e1" },
    scoreCol:   { alignItems: "center", gap: 4 },
    scoreBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
    scoreText:  { fontSize: 15, fontWeight: "800" },
    scoreLbl:   { fontSize: 10, color: "#94a3b8", fontWeight: "500" },

    empty:     { alignItems: "center", marginTop: 80, gap: 10 },
    emptyText: { fontSize: 15, color: "#94a3b8", fontWeight: "600" },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    modalBox:     { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, maxHeight: "70%" },
    modalTitle:   { fontSize: 16, fontWeight: "800", color: "#0f172a", marginBottom: 12 },
    quizOption:   { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4 },
    quizOptionActive: { backgroundColor: "#ede9fe" },
    quizOptionText:   { flex: 1, fontSize: 14, color: "#334155" },
});

export default ManageStudentsScreen;
