import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    FlatList,
    StyleSheet,
    Alert,
    BackHandler
} from "react-native";
import { Text, Card, Icon, Button, ProgressBar } from "react-native-paper";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { authApis, endpoints } from "../../configs/Apis";
import { Header, Loading } from "../../components/common";




const useTimer = (totalSeconds, onTimeUp) => {
    const [timeLeft, setTimeLeft] = useState(totalSeconds);
    const intervalRef = useRef(null);
    const onTimeUpRef = useRef(onTimeUp);


    useEffect(() => {
        onTimeUpRef.current = onTimeUp;
    }, [onTimeUp]);


    useEffect(() => {
        if (totalSeconds !== null) {
            setTimeLeft(totalSeconds);
        }
    }, [totalSeconds]);

    useEffect(() => {
        if (!totalSeconds) return; 

        intervalRef.current = setInterval(() => {
            setTimeLeft(prev => {

                if (prev === null) return prev; 

                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    onTimeUpRef.current?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [totalSeconds]);

    const stop = () => clearInterval(intervalRef.current);

    const formatTime = (sec) => {
        if (sec === null) return "00:00";
        const m = Math.floor(sec / 60).toString().padStart(2, "0");
        const s = (sec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    return { timeLeft, formatTime, stop };
};




const QuizTakeScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { quizId, title, courseId} = route.params;

    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);


    const [selectedAnswers, setSelectedAnswers] = useState({});




    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                setLoading(true);
                const token = await AsyncStorage.getItem("token");
                const res = await authApis(token).get(endpoints["quiz-detail"](quizId));
                setQuiz(res.data);
            } catch (ex) {
                console.error("Fetch quiz error:", ex);
                Alert.alert("Lỗi", "Không thể tải bài kiểm tra.", [
                    { text: "Quay lại", onPress: () => navigation.goBack() }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchQuiz();
    }, [quizId]);




    const totalSeconds = quiz?.time_limit ? quiz.time_limit * 60 : null;

    const handleTimeUp = useCallback(() => {
        Alert.alert(
            "⏰ Hết giờ!",
            "Thời gian làm bài đã kết thúc. Bài làm sẽ được nộp tự động.",
            [{ text: "OK", onPress: () => submitQuiz(true) }]
        );
    }, [selectedAnswers]); // selectedAnswers trong closure

    const { timeLeft, formatTime, stop } = useTimer(totalSeconds, handleTimeUp);




    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                Alert.alert(
                    "Thoát bài thi?",
                    "Nếu thoát, tiến trình làm bài sẽ bị mất.",
                    [
                        { text: "Tiếp tục làm", style: "cancel" },
                        { text: "Thoát", style: "destructive", onPress: () => navigation.goBack() }
                    ]
                );
                return true; // chặn back mặc định
            };

           const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
        return () => subscription.remove();
        }, [])
    );




    const handleSelectAnswer = (questionId, answerId) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [String(questionId)]: answerId
        }));
    };




    const submitQuiz = async (isAutoSubmit = false) => {
        if (submitting) return;

        const unansweredCount = quiz.questions.filter(
            q => !selectedAnswers[String(q.id)]
        ).length;


        if (!isAutoSubmit && unansweredCount > 0) {
            Alert.alert(
                "Còn câu chưa trả lời",
                `Bạn còn ${unansweredCount} câu chưa chọn đáp án. Vẫn muốn nộp bài?`,
                [
                    { text: "Làm tiếp", style: "cancel" },
                    { text: "Nộp bài", style: "destructive", onPress: () => doSubmit() }
                ]
            );
            return;
        }

        doSubmit();
    };

    const doSubmit = async () => {
        try {
            setSubmitting(true);
            stop(); // Dừng timer

            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).post(
                endpoints["quiz-submit"](quizId),
                { submitted_answers: selectedAnswers }
            );


            navigation.replace("QuizResult", { resultData: res.data
                
             });

        } catch (ex) {
            console.error("Submit error:", ex);
            Alert.alert("Lỗi", "Không thể nộp bài. Vui lòng thử lại.");
            setSubmitting(false);
        }
    };




    if (loading) return <Loading text="Đang tải bài kiểm tra..." />;

    if (!quiz) return null;

    const totalQuestions = quiz.questions?.length ?? 0;
    const answeredCount = Object.keys(selectedAnswers).length;
    const progressValue = totalQuestions > 0 ? answeredCount / totalQuestions : 0;
    const isWarning = totalSeconds && timeLeft <= 60; // Đỏ khi còn 60 giây

    return (
        <View style={styles.screen}>
            {/* Header tuỳ chỉnh — không có nút back mặc định */}
            <View style={styles.header}>
                <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>

                {/* Timer */}
               {totalSeconds && timeLeft !== null && (
    <View style={[styles.timerBadge, timeLeft <= 60 && styles.timerWarning]}>
        <Icon
            source="clock-outline"
            size={16}
            color={timeLeft <= 60 ? "#dc2626" : "#4f46e5"}
        />
        <Text style={[styles.timerText, timeLeft <= 60 && styles.timerTextWarning]}>
            {formatTime(timeLeft)}
        </Text>
    </View>
)}
            </View>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                    Đã trả lời: {answeredCount}/{totalQuestions} câu
                </Text>
                <ProgressBar
                    progress={progressValue}
                    color="#4f46e5"
                    style={styles.progressBar}
                />
            </View>

            {/* Danh sách câu hỏi */}
            <FlatList
                data={quiz.questions}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: question, index }) => {
                    const selectedId = selectedAnswers[String(question.id)];

                    return (
                        <Card style={styles.questionCard} mode="outlined">
                            <Card.Content>
                                {/* Câu hỏi */}
                                <View style={styles.questionHeader}>
                                    <View style={styles.questionIndex}>
                                        <Text style={styles.questionIndexText}>
                                            {index + 1}
                                        </Text>
                                    </View>
                                    <Text style={styles.questionContent}>
                                        {question.content}
                                    </Text>
                                </View>

                                {/* Đáp án */}
                                <View style={styles.answersContainer}>
                                    {question.answers?.map(answer => {
                                        const isSelected = selectedId === answer.id;

                                        return (
                                            <View
                                                key={answer.id}
                                                style={[
                                                    styles.answerOption,
                                                    isSelected && styles.answerSelected
                                                ]}
                                            >
                                                <Button
                                                    mode="text"
                                                    onPress={() => handleSelectAnswer(question.id, answer.id)}
                                                    style={styles.answerButton}
                                                    contentStyle={styles.answerButtonContent}
                                                    labelStyle={[
                                                        styles.answerLabel,
                                                        isSelected && styles.answerLabelSelected
                                                    ]}
                                                    icon={isSelected
                                                        ? "check-circle"
                                                        : "checkbox-blank-circle-outline"
                                                    }
                                                >
                                                    {answer.content}
                                                </Button>
                                            </View>
                                        );
                                    })}
                                </View>
                            </Card.Content>
                        </Card>
                    );
                }}


                ListFooterComponent={
                    <Button
                        mode="contained"
                        style={styles.submitBtn}
                        contentStyle={{ height: 52 }}
                        labelStyle={{ fontSize: 16, fontWeight: "bold" }}
                        loading={submitting}
                        disabled={submitting}
                        icon="send-check"
                        onPress={() => submitQuiz(false)}
                    >
                        Nộp bài ({answeredCount}/{totalQuestions})
                    </Button>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f8fafc" },


    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    headerTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
        marginRight: 12,
    },
    timerBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#ede9fe",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    timerWarning: {
        backgroundColor: "#fee2e2", // đỏ khi gần hết giờ
    },
    timerText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#4f46e5",
    },
    timerTextWarning: {
        color: "#dc2626",
    },


    progressContainer: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    progressText: {
        fontSize: 12,
        color: "#64748b",
        marginBottom: 6,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        backgroundColor: "#e2e8f0",
    },


    list: { padding: 16, paddingBottom: 32 },


    questionCard: {
        marginBottom: 16,
        backgroundColor: "#ffffff",
        borderRadius: 14,
        borderColor: "#e2e8f0",
    },
    questionHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 16,
    },
    questionIndex: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#4f46e5",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 2,
    },
    questionIndexText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "bold",
    },
    questionContent: {
        flex: 1,
        fontSize: 15,
        fontWeight: "600",
        color: "#0f172a",
        lineHeight: 24,
    },


    answersContainer: { gap: 8 },
    answerOption: {
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: "#e2e8f0",
        backgroundColor: "#f8fafc",
        overflow: "hidden",
    },
    answerSelected: {
        borderColor: "#4f46e5",
        backgroundColor: "#ede9fe",
    },
    answerButton: {
        margin: 0,
        borderRadius: 0,
    },
    answerButtonContent: {
        justifyContent: "flex-start",
        paddingVertical: 4,
        paddingHorizontal: 4,
    },
    answerLabel: {
        fontSize: 14,
        color: "#334155",
        fontWeight: "400",
        textAlign: "left",
    },
    answerLabelSelected: {
        color: "#4f46e5",
        fontWeight: "600",
    },


    submitBtn: {
        marginTop: 8,
        borderRadius: 12,
        backgroundColor: "#4f46e5",
    },
});

export default QuizTakeScreen;
