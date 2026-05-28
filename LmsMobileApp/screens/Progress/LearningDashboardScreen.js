import React, { useState, useCallback } from "react";
import { View, FlatList, StyleSheet, Dimensions } from "react-native";
import { Text, Card, ProgressBar, Chip, Icon, Button } from "react-native-paper";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { authApis, endpoints } from "../../configs/Apis";
import { Header, Loading } from "../../components/common";

const { width } = Dimensions.get("window");


const StatCard = ({ icon, value, label, color, bg }) => (
    <View style={[statStyles.card, { backgroundColor: bg }]}>
        <View style={[statStyles.iconWrap, { backgroundColor: color + "22" }]}>
            <Icon source={icon} size={20} color={color} />
        </View>
        <Text style={[statStyles.value, { color }]}>{value}</Text>
        <Text style={statStyles.label}>{label}</Text>
    </View>
);

const statStyles = StyleSheet.create({
    card: {
        flex: 1,
        borderRadius: 14,
        padding: 12,
        alignItems: "center",
        gap: 4,
        minWidth: (width - 48 - 24) / 4,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 2,
    },
    value: { fontSize: 18, fontWeight: "800" },
    label: { fontSize: 10, color: "#64748b", fontWeight: "600", textAlign: "center" },
});


const RoadmapSection = ({ enrollments }) => {
    const total = enrollments.length;
    const completed = enrollments.filter(e => (e.progress_percent ?? 0) >= 100).length;
    const inProgress = enrollments.filter(
        e => (e.progress_percent ?? 0) > 0 && (e.progress_percent ?? 0) < 100
    ).length;
    const notStarted = total - completed - inProgress;
    const overallPct = total > 0
        ? Math.round(enrollments.reduce((s, e) => s + (e.progress_percent ?? 0), 0) / total)
        : 0;

    const milestones = [
        { pct: 25, label: "Khởi động", icon: "rocket-launch-outline" },
        { pct: 50, label: "Nửa chặng", icon: "flag-checkered" },
        { pct: 75, label: "Gần đích",  icon: "lightning-bolt" },
        { pct: 100, label: "Hoàn thành", icon: "trophy-outline" },
    ];

    return (
        <View style={roadmapStyles.section}>
            <View style={roadmapStyles.header}>
                <Text style={roadmapStyles.title}>Lộ trình học tập</Text>
                <Text style={roadmapStyles.pct}>{overallPct}%</Text>
            </View>

            <View style={roadmapStyles.barWrap}>
                <View style={[roadmapStyles.barFill, { width: `${overallPct}%` }]} />
                {milestones.map(m => (
                    <View key={m.pct} style={[roadmapStyles.milestone, { left: `${m.pct}%` }]}>
                        <View style={[
                            roadmapStyles.milestoneDot,
                            overallPct >= m.pct && roadmapStyles.milestoneDotActive,
                        ]} />
                    </View>
                ))}
            </View>

            <View style={roadmapStyles.labels}>
                {milestones.map(m => (
                    <View key={m.pct} style={roadmapStyles.labelItem}>
                        <Icon source={m.icon} size={14} color={overallPct >= m.pct ? "#4f46e5" : "#cbd5e1"} />
                        <Text style={[roadmapStyles.labelText, overallPct >= m.pct && { color: "#4f46e5" }]}>
                            {m.label}
                        </Text>
                    </View>
                ))}
            </View>

            <View style={roadmapStyles.chips}>
                <View style={[roadmapStyles.summaryChip, { backgroundColor: "#dcfce7" }]}>
                    <Icon source="check-circle" size={13} color="#16a34a" />
                    <Text style={[roadmapStyles.chipText, { color: "#16a34a" }]}>{completed} Hoàn thành</Text>
                </View>
                <View style={[roadmapStyles.summaryChip, { backgroundColor: "#ede9fe" }]}>
                    <Icon source="book-open-variant" size={13} color="#4f46e5" />
                    <Text style={[roadmapStyles.chipText, { color: "#4f46e5" }]}>{inProgress} Đang học</Text>
                </View>
                <View style={[roadmapStyles.summaryChip, { backgroundColor: "#f1f5f9" }]}>
                    <Icon source="book-outline" size={13} color="#94a3b8" />
                    <Text style={[roadmapStyles.chipText, { color: "#94a3b8" }]}>{notStarted} Chưa bắt đầu</Text>
                </View>
            </View>
        </View>
    );
};

const roadmapStyles = StyleSheet.create({
    section: {
        marginHorizontal: 16,
        marginBottom: 14,
        backgroundColor: "#ffffff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        padding: 16,
    },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    title: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
    pct: { fontSize: 20, fontWeight: "800", color: "#4f46e5" },
    barWrap: {
        height: 10,
        backgroundColor: "#e2e8f0",
        borderRadius: 5,
        marginBottom: 20,
        position: "relative",
        overflow: "visible",
    },
    barFill: { height: "100%", backgroundColor: "#4f46e5", borderRadius: 5, maxWidth: "100%" },
    milestone: { position: "absolute", top: -3, marginLeft: -8 },
    milestoneDot: {
        width: 16, height: 16, borderRadius: 8,
        backgroundColor: "#e2e8f0", borderWidth: 2, borderColor: "#ffffff",
    },
    milestoneDotActive: { backgroundColor: "#4f46e5" },
    labels: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
    labelItem: { alignItems: "center", gap: 2 },
    labelText: { fontSize: 10, color: "#94a3b8", fontWeight: "600" },
    chips: { flexDirection: "row", gap: 8, flexWrap: "nowrap", justifyContent: "space-between" },
    summaryChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, flex: 1, minWidth: 0, justifyContent: "center" },
    chipText: { fontSize: 11, fontWeight: "700", flexShrink: 1 },
});


const CourseCard = ({ item, onPressCourse, onPressQuiz }) => {
    const course = item.course;
    const progress = item.progress_percent ?? 0;
    const isCompleted = progress >= 100;

    const viewedMaterials = item.viewed_materials ?? 0;
    const totalMaterials = item.total_materials ?? 0;
    const studyMinutes = item.study_minutes ?? 0;
    const hours = Math.floor(studyMinutes / 60);
    const mins = studyMinutes % 60;

    const getStatusInfo = (p) => {
        if (p >= 100) return { label: "Hoàn thành", color: "#16a34a", bg: "#dcfce7", icon: "check-circle" };
        if (p > 0)   return { label: "Đang học",    color: "#4f46e5", bg: "#ede9fe", icon: "book-open-variant" };
        return             { label: "Chưa bắt đầu", color: "#94a3b8", bg: "#f1f5f9", icon: "book-outline" };
    };
    const statusInfo = getStatusInfo(progress);

    return (
        <Card style={cardStyles.card} mode="outlined">
            {course?.image && (
                <Card.Cover source={{ uri: course.image }} style={cardStyles.cover} />
            )}
            <Card.Content style={cardStyles.content}>
                <View style={cardStyles.titleRow}>
                    <Text style={cardStyles.title} numberOfLines={2}>
                        {course?.subject ?? "Không rõ tên"}
                    </Text>
                    <Chip
                        icon={statusInfo.icon}
                        style={[cardStyles.chip, { backgroundColor: statusInfo.bg }]}
                        textStyle={{ color: statusInfo.color, fontSize: 11, fontWeight: "700" }}
                    >
                        {statusInfo.label}
                    </Chip>
                </View>

                {course?.teacher?.username && (
                    <View style={cardStyles.teacherRow}>
                        <Icon source="account-tie" size={13} color="#94a3b8" />
                        <Text style={cardStyles.teacherText}>{course.teacher.username}</Text>
                    </View>
                )}

                <View style={cardStyles.miniStats}>
                    <View style={cardStyles.miniStat}>
                        <Icon source="file-document-outline" size={14} color="#4f46e5" />
                        <Text style={cardStyles.miniStatText}>{viewedMaterials}/{totalMaterials} tài liệu</Text>
                    </View>
                    <View style={cardStyles.miniDivider} />
                    <View style={cardStyles.miniStat}>
                        <Icon source="clock-outline" size={14} color="#0891b2" />
                        <Text style={cardStyles.miniStatText}>
                            {hours > 0 ? `${hours}g ` : ""}{mins}p học
                        </Text>
                    </View>
                </View>

                <View style={cardStyles.progressSection}>
                    <View style={cardStyles.progressLabelRow}>
                        <Text style={cardStyles.progressLabel}>Tiến độ</Text>
                        <Text style={[cardStyles.progressPct, { color: isCompleted ? "#16a34a" : "#4f46e5" }]}>
                            {Math.round(progress)}%
                        </Text>
                    </View>
                    <ProgressBar
                        progress={progress / 100}
                        color={isCompleted ? "#16a34a" : "#4f46e5"}
                        style={cardStyles.progressBar}
                    />
                </View>

                <View style={cardStyles.actionRow}>
                    <Button
                        mode={isCompleted ? "outlined" : "contained"}
                        icon="play-circle"
                        style={[cardStyles.btn, cardStyles.btnFlex, !isCompleted && { backgroundColor: "#4f46e5" }]}
                        contentStyle={cardStyles.btnContent}
                        textColor={isCompleted ? "#4f46e5" : "#ffffff"}
                        labelStyle={cardStyles.btnLabel}
                        onPress={() => onPressCourse(course?.id)}
                    >
                        {progress > 0 ? "Tiếp tục" : "Bắt đầu"}
                    </Button>
                    {isCompleted && (
                        <Button
                            mode="contained"
                            icon="pencil-box-outline"
                            style={[cardStyles.btn, cardStyles.btnFlex, { backgroundColor: "#4f46e5" }]}
                            contentStyle={cardStyles.btnContent}
                            labelStyle={cardStyles.btnLabel}
                            onPress={() => onPressQuiz(course?.id)}
                        >
                            Kiểm tra
                        </Button>
                    )}
                </View>
            </Card.Content>
        </Card>
    );
};

const cardStyles = StyleSheet.create({
    card: { marginBottom: 16, backgroundColor: "#ffffff", borderRadius: 16, borderColor: "#e2e8f0", overflow: "hidden" },
    cover: { height: 140 },
    content: { padding: 16 },
    titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 },
    title: { flex: 1, fontSize: 15, fontWeight: "700", color: "#0f172a", lineHeight: 22 },
    chip: { borderRadius: 20, height: 28 },
    teacherRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 10 },
    teacherText: { fontSize: 12, color: "#94a3b8" },
    miniStats: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "#f8fafc", borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12, gap: 8,
    },
    miniStat: { flexDirection: "row", alignItems: "center", gap: 5 },
    miniStatText: { fontSize: 12, color: "#334155", fontWeight: "600" },
    miniDivider: { width: 1, height: 14, backgroundColor: "#e2e8f0" },
    progressSection: { marginBottom: 12 },
    progressLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    progressLabel: { fontSize: 12, color: "#64748b", fontWeight: "500" },
    progressPct: { fontSize: 12, fontWeight: "700" },
    progressBar: { height: 8, borderRadius: 4, backgroundColor: "#e2e8f0" },
    actionRow: { flexDirection: "row", gap: 10 },
    btn: { borderRadius: 10, borderColor: "#4f46e5" },
    btnFlex: { flex: 1 },
    btnContent: { height: 40 },
    btnLabel: { fontSize: 13, fontWeight: "700" },
});


const LearningDashboardScreen = () => {
    const nav = useNavigation();
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        totalHours: 0,
        totalMaterials: 0,
        completedCourses: 0,
    });

    const fetchEnrollments = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(endpoints["my-courses"], {
                params: { status: "active" },
            });
            const list = res.data.results ?? res.data;
            const safeList = Array.isArray(list) ? list : [];
            setEnrollments(safeList);

            const completed  = safeList.filter(e => (e.progress_percent ?? 0) >= 100).length;
            const totalMat   = safeList.reduce((s, e) => s + (e.viewed_materials ?? 0), 0);
            const totalMins  = safeList.reduce((s, e) => s + (e.study_minutes ?? 0), 0);

            setSummary({
                totalHours: Math.floor(totalMins / 60),
                totalMaterials: totalMat,
                completedCourses: completed,
            });
        } catch (ex) {
            console.error("Fetch enrollments error:", ex);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchEnrollments(); }, []));

    const ListHeader = () => (
        <>
           
            {enrollments.length > 0 && <RoadmapSection enrollments={enrollments} />}

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Khóa học của tôi</Text>
                <Text style={styles.sectionCount}>{enrollments.length} khóa</Text>
            </View>
        </>
    );

    return (
        <View style={styles.screen}>
            <Header title="Tiến độ học tập" />
            {loading ? (
                <Loading text="Đang tải tiến độ..." />
            ) : (
                <FlatList
                    data={enrollments}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={<ListHeader />}
                    renderItem={({ item }) => (
                        <CourseCard
                            item={item}
                            onPressCourse={(id) =>  nav.navigate("HomeTab", { 
                                screen: "MaterialList", 
                                params: { courseId: id }
                            })}
                            onPressQuiz={(id) => nav.navigate("HomeTab", { 
                                screen: "QuizList", 
                                params: { courseId: id }
                            })}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon source="book-off-outline" size={56} color="#cbd5e1" />
                            <Text style={styles.emptyTitle}>Chưa có khóa học nào</Text>
                            <Text style={styles.emptySubtitle}>
                                Hãy đăng ký một khóa học để bắt đầu hành trình học tập!
                            </Text>
                            <Button
                                mode="contained"
                                icon="magnify"
                                style={{ backgroundColor: "#4f46e5", borderRadius: 12, marginTop: 8 }}
                                onPress={() => navigation.navigate("CourseList")}
                            >
                                Khám phá khóa học
                            </Button>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f8fafc" },
    list: { paddingBottom: 32 },
    statsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 16, marginBottom: 14 },
    sectionHeader: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 16, marginBottom: 10,
    },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
    sectionCount: {
        fontSize: 12, color: "#64748b", backgroundColor: "#e2e8f0",
        paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, fontWeight: "600",
    },
    emptyContainer: { alignItems: "center", marginTop: 40, paddingHorizontal: 32, gap: 12 },
    emptyTitle: { fontSize: 17, fontWeight: "700", color: "#334155" },
    emptySubtitle: { fontSize: 14, color: "#94a3b8", textAlign: "center", lineHeight: 22 },
});

export default LearningDashboardScreen;
