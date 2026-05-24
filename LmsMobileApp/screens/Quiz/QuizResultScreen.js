import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Card, Icon } from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";

// Tận dụng triệt để bộ components dùng chung mà bạn đã cung cấp
import { Header, InfoRow, ActionRow } from "../../components/common";

const QuizResultScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();

    // Lấy dữ liệu trả về từ API submit_quiz ở màn hình trước
    const { resultData ,courseId} = route.params || {};

    // Fallback UI nếu không có dữ liệu
    if (!resultData) {
        return (
            <View style={styles.screen}>
                <Header title="Kết quả bài thi" showBack />
                <View style={styles.center}>
                    <Text style={styles.errorText}>Không tìm thấy dữ liệu kết quả.</Text>
                </View>
            </View>
        );
    }

    const isPassed = resultData.is_passed;

    return (
        <View style={styles.screen}>
            {/* Sử dụng Header Component của bạn */}
            <Header title="Kết quả bài thi" showBack />
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                
                {/* Hero Section: Hiển thị trạng thái Đậu/Rớt trực quan */}
                <View style={styles.heroSection}>
                    <View style={[styles.iconCircle, { backgroundColor: isPassed ? "#dcfce7" : "#fee2e2" }]}>
                        <Icon 
                            source={isPassed ? "trophy" : "close-circle-outline"} 
                            size={60} 
                            color={isPassed ? "#16a34a" : "#dc2626"} 
                        />
                    </View>
                    <Text style={[styles.statusText, { color: isPassed ? "#16a34a" : "#dc2626" }]}>
                        {isPassed ? "Chúc mừng! Bạn đã đạt" : "Rất tiếc! Bạn chưa đạt"}
                    </Text>
                    <Text style={styles.percentageText}>
                        {resultData.percentage}%
                    </Text>
                    <Text style={styles.messageText}>
                        {resultData.message}
                    </Text>
                </View>

                {/* Phần Thống kê chi tiết: Tận dụng InfoRow component */}
                <Card style={styles.card} mode="outlined">
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.cardTitle}>Chi tiết kết quả</Text>
                        
                        <View style={styles.rowSpacing}>
                            <InfoRow 
                                icon="star-outline" 
                                label="Tổng điểm đạt được" 
                                value={`${resultData.score} điểm`} 
                            />
                        </View>
                        <View style={styles.rowSpacing}>
                            <InfoRow 
                                icon="percent-outline" 
                                label="Tỷ lệ chính xác" 
                                value={`${resultData.percentage}%`} 
                            />
                        </View>
                        <View style={styles.rowSpacing}>
                            <InfoRow 
                                icon="check-decagram-outline" 
                                label="Trạng thái" 
                                value={isPassed ? "Qua môn" : "Học lại"} 
                            />
                        </View>
                    </Card.Content>
                </Card>

                {/* Phần Điều hướng: Tận dụng ActionRow component */}
                <Card style={styles.card} mode="outlined">
                    <View style={styles.actionContainer}>
                        <ActionRow 
                            icon="text-box-search-outline" 
                            label="Xem lại bài làm & Giải thích" 
                            onPress={() => navigation.navigate("QuizReview", { resultId: resultData.result_id })} 
                        />
                        
    
                    
                    </View>
                </Card>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f8fafc" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    content: { padding: 20 },
    heroSection: {
        alignItems: "center",
        paddingVertical: 32,
        marginBottom: 16,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    statusText: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 8,
    },
    percentageText: {
        fontSize: 56,
        fontWeight: "900",
        color: "#0f172a",
        marginBottom: 8,
    },
    messageText: {
        fontSize: 14,
        color: "#64748b",
        fontStyle: "italic",
    },
    card: {
        backgroundColor: "#ffffff",
        marginBottom: 20,
        borderRadius: 16,
        borderColor: "#e2e8f0",
        borderWidth: 1,
    },
    cardTitle: {
        fontWeight: "bold",
        marginBottom: 20,
        color: "#334155"
    },
    rowSpacing: {
        marginBottom: 16, // Tạo khoảng cách đều giữa các InfoRow
    },
    actionContainer: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    divider: {
        height: 1,
        backgroundColor: "#f1f5f9",
        marginHorizontal: 16,
        marginVertical: 4,
    },
    errorText: {
        color: "#94a3b8",
        fontSize: 16,
    }
});

export default QuizResultScreen;
