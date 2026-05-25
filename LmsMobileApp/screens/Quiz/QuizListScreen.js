import React, { useState, useCallback } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Text, Card, Chip, Icon } from "react-native-paper";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { authApis, endpoints } from "../../configs/Apis";
import { Header, Loading } from "../../components/common";

const QuizListScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { courseId } = route.params;

    const [quizzes, setQuizzes] = useState([]);
    const [myResults, setMyResults] = useState({}); // { quizId: latestResult }
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");

            // Gọi song song 2 API cho nhanh
            const [quizRes, resultRes] = await Promise.all([
                authApis(token).get(endpoints["quiz-list"], {
                    params: { course: courseId }
                }),
                authApis(token).get(endpoints["test-results"])
            ]);

            const quizList = quizRes.data.results ?? quizRes.data;
            setQuizzes(Array.isArray(quizList) ? quizList : []);

        
            const resultMap = {};
            const results = resultRes.data.results ?? resultRes.data;
            if (Array.isArray(results)) {
                results.forEach(r => {
                  
                    if (!resultMap[r.quiz.id]) {
                        resultMap[r.quiz.id] = r;
                    }
                });
            }
            setMyResults(resultMap);

        } catch (ex) {
            console.error("Fetch quiz error:", ex);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [courseId])
    );

    const getStatusChip = (quizId) => {
        const result = myResults[quizId];
        if (!result) return { label: "Chưa làm", color: "#f1f5f9", textColor: "#64748b", icon: "minus-circle-outline" };
        if (result.is_passed) return { label: "Đã đạt", color: "#dcfce7", textColor: "#16a34a", icon: "check-circle" };
        return { label: "Chưa đạt", color: "#fee2e2", textColor: "#dc2626", icon: "close-circle" };
    };

    const renderQuizCard = ({ item }) => {
        const status = getStatusChip(item.id);
        const lastResult = myResults[item.id];

        return (
            <Card
                style={styles.card}
                mode="outlined"
                onPress={() => navigation.navigate("QuizTake", { quizId: item.id, title: item.title })}
            >
                <Card.Content>
                    {/* Header row */}
                    <View style={styles.cardHeader}>
                        <View style={styles.iconCircle}>
                            <Icon source="pencil-box-outline" size={24} color="#4f46e5" />
                        </View>
                        <View style={styles.cardInfo}>
                            <Text style={styles.quizTitle} numberOfLines={2}>
                                {item.title}
                            </Text>
                            <View style={styles.metaRow}>
                                {item.time_limit && (
                                    <View style={styles.metaItem}>
                                        <Icon source="clock-outline" size={13} color="#94a3b8" />
                                        <Text style={styles.metaText}>{item.time_limit} phút</Text>
                                    </View>
                                )}
                                <View style={styles.metaItem}>
                                    <Icon source="flag-outline" size={13} color="#94a3b8" />
                                    <Text style={styles.metaText}>Đạt: {item.passing_score}%</Text>
                                </View>
                            </View>
                        </View>

                        {/* Status Chip */}
                        <Chip
                            icon={status.icon}
                            style={[styles.chip, { backgroundColor: status.color }]}
                            textStyle={{ color: status.textColor, fontSize: 11, fontWeight: "700" }}
                        >
                            {status.label}
                        </Chip>
                    </View>

                    {/* Hiển thị điểm lần làm gần nhất nếu có */}
                    {lastResult && (
                        <View style={styles.lastResultRow}>
                            <Text style={styles.lastResultText}>
                                Lần gần nhất: {lastResult.percentage}%
                                ({lastResult.score} điểm)
                            </Text>
                            <Icon
                                source="chevron-right"
                                size={16}
                                color="#94a3b8"
                            />
                        </View>
                    )}
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={styles.screen}>
            <Header title="Bài kiểm tra" showBack />

            {loading ? (
                <Loading text="Đang tải bài kiểm tra..." />
            ) : (
                <FlatList
                    data={quizzes}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    renderItem={renderQuizCard}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon source="pencil-box-multiple-outline" size={50} color="#cbd5e1" />
                            <Text style={styles.emptyText}>Chưa có bài kiểm tra nào.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f8fafc" },
    list: { padding: 16 },
    card: {
        marginBottom: 14,
        backgroundColor: "#ffffff",
        borderRadius: 14,
        borderColor: "#e2e8f0",
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "#ede9fe",
        justifyContent: "center",
        alignItems: "center",
    },
    cardInfo: { flex: 1 },
    quizTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 4,
        lineHeight: 22,
    },
    metaRow: { flexDirection: "row", gap: 12 },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    metaText: { fontSize: 12, color: "#94a3b8" },
    chip: { borderRadius: 20 },
    lastResultRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
    },
    lastResultText: { fontSize: 13, color: "#64748b", fontWeight: "500" },
    emptyContainer: { alignItems: "center", marginTop: 80, gap: 12 },
    emptyText: { fontSize: 15, color: "#94a3b8" },
});

export default QuizListScreen;
