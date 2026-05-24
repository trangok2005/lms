import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Text, Card, Icon, Divider } from "react-native-paper";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { authApis, endpoints } from "../../configs/Apis";
import { Header, Loading } from "../../components/common";

const QuizReviewScreen = () => {
    const route = useRoute();
    const { resultId ,courseId } = route.params;

    const [reviewData, setReviewData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviewData = async () => {
            try {
                const token = await AsyncStorage.getItem("token");
                // Backend API needs to return TestResult details including Question list and is_correct flags
                const res = await authApis(token).get(endpoints["result-detail"](resultId));
                setReviewData(res.data);
            } catch (error) {
                console.error("Fetch review error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReviewData();
    }, [resultId]);

    // Helper: Determine the background and border color for an answer option
    const getAnswerStyle = (questionId, answer) => {
        const submittedAnswerId = reviewData?.submitted_answers?.[String(questionId)];
        const isSelected = submittedAnswerId === answer.id;
        const isCorrect = answer.is_correct;

        if (isSelected && isCorrect) {
            return styles.correctSelected; // Chose correct -> Green
        }
        if (isSelected && !isCorrect) {
            return styles.wrongSelected; // Chose wrong -> Red
        }
        if (!isSelected && isCorrect) {
            return styles.correctMissed; // Didn't choose but it's correct -> Light Green
        }
        
        return styles.neutralAnswer; // Default option
    };

    // Helper: Determine the icon to display next to the answer
    const getAnswerIcon = (questionId, answer) => {
        const submittedAnswerId = reviewData?.submitted_answers?.[String(questionId)];
        const isSelected = submittedAnswerId === answer.id;

        if (isSelected && answer.is_correct) return "check-circle";
        if (isSelected && !answer.is_correct) return "close-circle";
        if (!isSelected && answer.is_correct) return "check-circle-outline";
        
        return "checkbox-blank-circle-outline";
    };

    if (loading) return <Loading text="Đang tải dữ liệu bài làm..." />;

    if (!reviewData) {
        return (
            <View style={styles.screen}>
                <Header title="Xem lại bài làm" showBack />
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>Không thể tải dữ liệu đánh giá.</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <Header title="Đánh giá chi tiết" showBack />
            
            <ScrollView contentContainerStyle={styles.content}>
                
                {/* AI Analysis Section (Only display if returned by Backend) */}
                {(reviewData.strength_analysis || reviewData.weakness_analysis) && (
                    <Card style={styles.aiCard} mode="elevated">
                        <Card.Content>
                            <View style={styles.aiHeader}>
                                <Icon source="robot-outline" size={24} color="#6366f1" />
                                <Text style={styles.aiTitle}>AI Phân tích năng lực</Text>
                            </View>
                            
                            {reviewData.strength_analysis && (
                                <View style={styles.analysisBlock}>
                                    <Text style={styles.analysisLabel}>Điểm mạnh:</Text>
                                    <Text style={styles.analysisText}>{reviewData.strength_analysis}</Text>
                                </View>
                            )}

                            {reviewData.weakness_analysis && (
                                <View style={styles.analysisBlock}>
                                    <Text style={styles.analysisLabel}>Cần khắc phục:</Text>
                                    <Text style={styles.analysisText}>{reviewData.weakness_analysis}</Text>
                                </View>
                            )}
                        </Card.Content>
                    </Card>
                )}

                <Text style={styles.sectionTitle}>Chi tiết các câu hỏi</Text>

                {/* Questions List */}
                {reviewData.quiz?.questions?.map((question, index) => {
                  
                    const submittedAnswerId = reviewData?.submitted_answers?.[String(question.id)];
                    
                 
                    const isQuestionCorrect = question.answers.some(
                        a => a.id === submittedAnswerId && a.is_correct
                    );

                    return (
                        <Card key={question.id} style={styles.questionCard} mode="outlined">
                            <Card.Content>
                                <View style={styles.questionHeader}>
                                    <Text style={styles.questionText}>
                                        Câu {index + 1}: {question.content}
                                    </Text>
                                    {/* Icon indicating if the question is correct or wrong */}
                                    <Icon 
                                        source={isQuestionCorrect ? "check-decagram" : "alert-circle-outline"} 
                                        size={24} 
                                        color={isQuestionCorrect ? "#16a34a" : "#dc2626"} 
                                    />
                                </View>

                                <Divider style={styles.divider} />

                                {/* Render Options */}
                                {question.answers?.map(answer => {
                                    const styleClass = getAnswerStyle(question.id, answer);
                                    const iconName = getAnswerIcon(question.id, answer);
                                    const isSelected = submittedAnswerId === answer.id;

                                    return (
                                        <View key={answer.id} style={[styles.answerRow, styleClass]}>
                                            <Icon 
                                                source={iconName} 
                                                size={20} 
                                                color={styleClass.borderColor} 
                                            />
                                            <Text style={[styles.answerText, { 
                                                color: isSelected || answer.is_correct ? "#0f172a" : "#64748b",
                                                fontWeight: isSelected || answer.is_correct ? "bold" : "normal"
                                            }]}>
                                                {answer.content}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </Card.Content>
                        </Card>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f8fafc" },
    centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    content: { padding: 16, paddingBottom: 40 },
    
    // AI Analysis Styles
    aiCard: { marginBottom: 24, backgroundColor: "#e0e7ff", borderRadius: 16, elevation: 0 },
    aiHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    aiTitle: { fontSize: 18, fontWeight: "bold", color: "#4338ca", marginLeft: 8 },
    analysisBlock: { marginBottom: 8, backgroundColor: "#ffffff", padding: 12, borderRadius: 8 },
    analysisLabel: { fontWeight: "bold", color: "#334155", marginBottom: 4 },
    analysisText: { color: "#475569", lineHeight: 22 },

    sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#1e293b", marginBottom: 12, marginLeft: 4 },
    
    // Question Styles
    questionCard: { marginBottom: 16, backgroundColor: "#ffffff", borderRadius: 12, borderColor: "#e2e8f0" },
    questionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
    questionText: { flex: 1, fontSize: 16, fontWeight: "bold", color: "#0f172a", marginRight: 12, lineHeight: 24 },
    divider: { marginBottom: 12, backgroundColor: "#f1f5f9" },

    // Answer Styles
    answerRow: { 
        flexDirection: "row", 
        alignItems: "center", 
        padding: 12, 
        borderRadius: 8, 
        marginBottom: 8,
        borderWidth: 1,
    },
    answerText: { flex: 1, marginLeft: 12, fontSize: 15, lineHeight: 22 },

    // Color Codes
    correctSelected: { backgroundColor: "#dcfce7", borderColor: "#16a34a" },
    wrongSelected: { backgroundColor: "#fee2e2", borderColor: "#dc2626" },
    correctMissed: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", borderStyle: "dashed" },
    neutralAnswer: { backgroundColor: "#f8fafc", borderColor: "#e2e8f0" },

    errorText: { color: "#94a3b8", fontSize: 16 }
});

export default QuizReviewScreen;
