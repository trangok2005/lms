import React, { useState, useCallback } from "react";
import {
    View,
    FlatList,
    StyleSheet,
} from "react-native";
import { Text, Card, ProgressBar, Chip, Icon, Button } from "react-native-paper";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { authApis, endpoints } from "../../configs/Apis";
import { Header, Loading } from "../../components/common";

const LearningDashboardScreen = () => {
    const navigation = useNavigation();
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchEnrollments = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(
                endpoints["my-courses"],
                { params: { status: "active" } }
            );
            const list = res.data.results ?? res.data;
            setEnrollments(Array.isArray(list) ? list : []);
        } catch (ex) {
            console.error("Fetch enrollments error:", ex);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchEnrollments();
        }, [])
    );

    const getStatusInfo = (progress) => {
        if (progress >= 100) return {
            label: "Hoàn thành",
            color: "#16a34a",
            bg: "#dcfce7",
            icon: "check-circle"
        };
        if (progress > 0) return {
            label: "Đang học",
            color: "#4f46e5",
            bg: "#ede9fe",
            icon: "book-open-variant"
        };
        return {
            label: "Chưa bắt đầu",
            color: "#94a3b8",
            bg: "#f1f5f9",
            icon: "book-outline"
        };
    };

    const renderItem = ({ item }) => {
        const course = item.course;
        const progress = item.progress_percent ?? 0;
        const isCompleted = progress >= 100;
        const statusInfo = getStatusInfo(progress);
        const courseId = course?.id;

        return (
            <Card style={styles.card} mode="outlined">
                {/* Thumbnail nếu có */}
                {course?.image && (
                    <Card.Cover
                        source={{ uri: course.image }}
                        style={styles.cover}
                    />
                )}

                <Card.Content style={styles.cardContent}>
                    {/* Tên course + status chip */}
                    <View style={styles.titleRow}>
                        <Text style={styles.courseTitle} numberOfLines={2}>
                            {course?.subject ?? "Không rõ tên"}
                        </Text>
                        <Chip
                            icon={statusInfo.icon}
                            style={[styles.chip, { backgroundColor: statusInfo.bg }]}
                            textStyle={{ color: statusInfo.color, fontSize: 11, fontWeight: "700" }}
                        >
                            {statusInfo.label}
                        </Chip>
                    </View>

                    {/* Giảng viên */}
                    {course?.teacher?.username && (
                        <View style={styles.teacherRow}>
                            <Icon source="account-tie" size={13} color="#94a3b8" />
                            <Text style={styles.teacherText}>
                                {course.teacher.username}
                            </Text>
                        </View>
                    )}

                    {/* Progress bar */}
                    <View style={styles.progressSection}>
                        <View style={styles.progressLabelRow}>
                            <Text style={styles.progressLabel}>Tiến độ</Text>
                            <Text style={[
                                styles.progressPercent,
                                { color: isCompleted ? "#16a34a" : "#4f46e5" }
                            ]}>
                                {Math.round(progress)}%
                            </Text>
                        </View>
                        <ProgressBar
                            progress={progress / 100}
                            color={isCompleted ? "#16a34a" : "#4f46e5"}
                            style={styles.progressBar}
                        />
                    </View>

                    {/* Action buttons */}
                    <View style={styles.actionRow}>
                        {/* Luôn có nút vào học */}
                        <Button
                            mode={isCompleted ? "outlined" : "contained"}
                            icon="play-circle"
                            style={[
                                styles.btn,
                                styles.btnFlex,
                                !isCompleted && { backgroundColor: "#4f46e5" }
                            ]}
                            contentStyle={styles.btnContent}
                            textColor={isCompleted ? "#4f46e5" : "#ffffff"}
                            labelStyle={styles.btnLabel}
                            onPress={() => navigation.navigate("MaterialList", { courseId })}
                        >
                            {progress > 0 ? "Tiếp tục" : "Bắt đầu"}
                        </Button>

                        {/* Nút kiểm tra — chỉ hiện khi đã hoàn thành */}
                        {isCompleted && (
                            <Button
                                mode="contained"
                                icon="pencil-box-outline"
                                style={[styles.btn, styles.btnFlex, { backgroundColor: "#4f46e5" }]}
                                contentStyle={styles.btnContent}
                                labelStyle={styles.btnLabel}
                                onPress={() => navigation.navigate("QuizList", { courseId })}
                            >
                                Kiểm tra
                            </Button>
                        )}
                    </View>
                </Card.Content>
            </Card>
        );
    };

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
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon source="book-off-outline" size={56} color="#cbd5e1" />
                            <Text style={styles.emptyTitle}>Chưa có khóa học nào</Text>
                            <Text style={styles.emptySubtitle}>
                                Hãy đăng ký một khóa học để bắt đầu hành trình học tập!
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f8fafc" },
    list: { padding: 16, paddingBottom: 32 },

    card: {
        marginBottom: 16,
        backgroundColor: "#ffffff",
        borderRadius: 16,
        borderColor: "#e2e8f0",
        overflow: "hidden",
    },
    cover: {
        height: 140,
        borderRadius: 0,
    },
    cardContent: {
        padding: 16,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 8,
        marginBottom: 8,
    },
    courseTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: "700",
        color: "#0f172a",
        lineHeight: 22,
    },
    chip: {
        borderRadius: 20,
        height: 28,
    },
    teacherRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginBottom: 14,
    },
    teacherText: {
        fontSize: 12,
        color: "#94a3b8",
    },
    progressSection: {
        marginBottom: 16,
    },
    progressLabelRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    progressLabel: {
        fontSize: 12,
        color: "#64748b",
        fontWeight: "500",
    },
    progressPercent: {
        fontSize: 12,
        fontWeight: "700",
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        backgroundColor: "#e2e8f0",
    },
    actionRow: {
        flexDirection: "row",
        gap: 10,
    },
    btn: {
        borderRadius: 10,
        borderColor: "#4f46e5",
    },
    btnFlex: { flex: 1 },
    btnContent: { height: 40 },
    btnLabel: { fontSize: 13, fontWeight: "700" },

    emptyContainer: {
        alignItems: "center",
        marginTop: 80,
        paddingHorizontal: 32,
        gap: 12,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#334155",
    },
    emptySubtitle: {
        fontSize: 14,
        color: "#94a3b8",
        textAlign: "center",
        lineHeight: 22,
    },
});

export default LearningDashboardScreen;
