import React, { useState, useCallback } from "react";
import {
    View, FlatList, StyleSheet, TouchableOpacity,
    Alert, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import {
    Text, Icon, Modal, Portal, TextInput,
    Button, Chip, Divider, Switch, ActivityIndicator,
} from "react-native-paper";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { authApis, endpoints } from "../../configs/Apis";
import { Header, Loading } from "../../components/common";

// ── Constants ──────────────────────────────────────────────
const EMPTY_QUIZ_FORM = {
    title: "",
    time_limit: "15",       
    passing_score: "50",    
    is_active: true,
};

const EMPTY_QUESTION_FORM = {
    content: "",
    explanation: "",
    choices: [
        { text: "", is_correct: true },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
    ],
};

// ── Main Component ────────────────────────────────────────
const ManageQuizScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { courseId, courseTitle } = route.params ?? {};

    // Quiz list state
    const [quizzes, setQuizzes]       = useState([]);
    const [loading, setLoading]       = useState(true);
    const [saving, setSaving]         = useState(false);
    const [quizModal, setQuizModal]   = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [quizForm, setQuizForm]     = useState(EMPTY_QUIZ_FORM);

    // Question management state
    const [selectedQuiz, setSelectedQuiz]       = useState(null); // quiz whose questions we manage
    const [questions, setQuestions]             = useState([]);
    const [questionsLoading, setQuestionsLoading] = useState(false);
    const [questionModal, setQuestionModal]     = useState(false);
    const [editQuestion, setEditQuestion]       = useState(null);
    const [questionForm, setQuestionForm]       = useState(EMPTY_QUESTION_FORM);
    const [questionSaving, setQuestionSaving]   = useState(false);

    // ── Fetch Quizzes ──────────────────────────────────────
    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(endpoints["teacher-quiz-list"](courseId));
            const list = res.data.results ?? res.data;
            setQuizzes(Array.isArray(list) ? list : []);
        } catch (ex) {
            console.error("Fetch quizzes error:", ex);
            Alert.alert("Lỗi", "Không thể tải danh sách quiz.");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => {
        if (courseId) fetchQuizzes();
    }, [courseId]));

    // ── Fetch Questions for a quiz ─────────────────────────
    const fetchQuestions = async (quizId) => {
        try {
            setQuestionsLoading(true);
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(endpoints["teacher-question-list"](quizId));
            const list = res.data.results ?? res.data;
            setQuestions(Array.isArray(list) ? list : []);
        } catch (ex) {
            console.error("Fetch questions error:", ex);
        } finally {
            setQuestionsLoading(false);
        }
    };

    const openQuestions = (quiz) => {
        setSelectedQuiz(quiz);
        fetchQuestions(quiz.id);
    };

    const closeQuestions = () => {
        setSelectedQuiz(null);
        setQuestions([]);
    };

    // ── Quiz Modal ─────────────────────────────────────────
    const openCreateQuiz = () => {
        setEditTarget(null);
        setQuizForm(EMPTY_QUIZ_FORM);
        setQuizModal(true);
    };

    const openEditQuiz = (item) => {
    setEditTarget(item);
    setQuizForm({
        title:         item.title ?? "",
        time_limit:    String(item.time_limit ?? "15"),       // ✅
        passing_score: String(item.passing_score ?? "50"),    // ✅
        is_active:     item.is_active ?? true,
    });
    setQuizModal(true);
};

    const closeQuizModal = () => { setQuizModal(false); setEditTarget(null); };

    const handleSaveQuiz = async () => {
        if (!quizForm.title.trim()) {
            Alert.alert("Thiếu thông tin", "Vui lòng nhập tiêu đề bài kiểm tra.");
            return;
        }
        try {
            setSaving(true);
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
           const payload = {
    title:         quizForm.title.trim(),
    time_limit:    parseInt(quizForm.time_limit) || 15,       // ✅
    passing_score: parseInt(quizForm.passing_score) || 50,    // ✅
    is_active:     quizForm.is_active,
    course:        courseId,
};

            if (editTarget) {
                await api.patch(endpoints["teacher-quiz-detail"](editTarget.id), payload);
                Alert.alert("✅ Đã cập nhật", "Bài kiểm tra đã được cập nhật.");
            } else {
                await api.post(endpoints["teacher-quiz-list"](), payload);
                Alert.alert("✅ Đã thêm", "Bài kiểm tra mới đã được tạo.");
            }
            closeQuizModal();
            fetchQuizzes();
        } catch (ex) {
            console.error("Save quiz error:", ex?.response?.data ?? ex);
            Alert.alert("Lỗi", "Không thể lưu bài kiểm tra. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteQuiz = (item) => {
        Alert.alert(
            "Xoá bài kiểm tra",
            `Bạn có chắc muốn xoá "${item.title}"? Toàn bộ câu hỏi bên trong cũng sẽ bị xoá.`,
            [
                { text: "Huỷ", style: "cancel" },
                {
                    text: "Xoá", style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem("token");
                            await authApis(token).delete(endpoints["teacher-quiz-detail"](item.id));
                            if (selectedQuiz?.id === item.id) closeQuestions();
                            fetchQuizzes();
                        } catch {
                            Alert.alert("Lỗi", "Không thể xoá bài kiểm tra.");
                        }
                    },
                },
            ]
        );
    };

    // ── Question Modal ─────────────────────────────────────
    const openCreateQuestion = () => {
        setEditQuestion(null);
        setQuestionForm(EMPTY_QUESTION_FORM);
        setQuestionModal(true);
    };

    const openEditQuestion = (q) => {
        setEditQuestion(q);
        setQuestionForm({
            content:     q.content ?? "",
            explanation: q.explanation ?? "",
            choices: q.choices?.length
                ? q.choices.map((c) => ({ text: c.text, is_correct: c.is_correct }))
                : EMPTY_QUESTION_FORM.choices,
        });
        setQuestionModal(true);
    };

    const closeQuestionModal = () => { setQuestionModal(false); setEditQuestion(null); };

    const setChoiceText = (idx, text) => {
        setQuestionForm((f) => {
            const choices = [...f.choices];
            choices[idx] = { ...choices[idx], text };
            return { ...f, choices };
        });
    };

    const setCorrectChoice = (idx) => {
        setQuestionForm((f) => ({
            ...f,
            choices: f.choices.map((c, i) => ({ ...c, is_correct: i === idx })),
        }));
    };

    const handleSaveQuestion = async () => {
        if (!questionForm.content.trim()) {
            Alert.alert("Thiếu thông tin", "Vui lòng nhập nội dung câu hỏi.");
            return;
        }
        const filledChoices = questionForm.choices.filter((c) => c.text.trim());
        if (filledChoices.length < 2) {
            Alert.alert("Thiếu đáp án", "Vui lòng nhập ít nhất 2 lựa chọn.");
            return;
        }
        if (!filledChoices.some((c) => c.is_correct)) {
            Alert.alert("Thiếu đáp án đúng", "Vui lòng chọn đáp án đúng.");
            return;
        }

        try {
            setQuestionSaving(true);
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const payload = {
                content:     questionForm.content.trim(),
                explanation: questionForm.explanation.trim(),
                quiz:        selectedQuiz.id,
                choices:     filledChoices,
            };

            if (editQuestion) {
                await api.patch(endpoints["teacher-question-detail"](editQuestion.id), payload);
            } else {
                await api.post(endpoints["teacher-question-list"](selectedQuiz.id), payload);
            }
            closeQuestionModal();
            fetchQuestions(selectedQuiz.id);
            // Update question_count in quiz list
            setQuizzes((prev) =>
                prev.map((q) =>
                    q.id === selectedQuiz.id
                        ? { ...q, question_count: (q.question_count ?? 0) + (editQuestion ? 0 : 1) }
                        : q
                )
            );
        } catch (ex) {
            console.error("Save question error:", ex?.response?.data ?? ex);
            Alert.alert("Lỗi", "Không thể lưu câu hỏi.");
        } finally {
            setQuestionSaving(false);
        }
    };

    const handleDeleteQuestion = (q) => {
        Alert.alert("Xoá câu hỏi", `Xoá câu hỏi này?`, [
            { text: "Huỷ", style: "cancel" },
            {
                text: "Xoá", style: "destructive",
                onPress: async () => {
                    try {
                        const token = await AsyncStorage.getItem("token");
                        await authApis(token).delete(endpoints["teacher-question-detail"](q.id));
                        fetchQuestions(selectedQuiz.id);
                        setQuizzes((prev) =>
                            prev.map((quiz) =>
                                quiz.id === selectedQuiz.id
                                    ? { ...quiz, question_count: Math.max(0, (quiz.question_count ?? 1) - 1) }
                                    : quiz
                            )
                        );
                    } catch {
                        Alert.alert("Lỗi", "Không thể xoá câu hỏi.");
                    }
                },
            },
        ]);
    };

    // ── Render: Quiz Card ──────────────────────────────────
    const renderQuizItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => openQuestions(item)}
        >
            <View style={[styles.statusBar, { backgroundColor: item.is_active ? "#16a34a" : "#94a3b8" }]} />

            <View style={styles.cardBody}>
                <Text style={styles.quizTitle} numberOfLines={2}>{item.title}</Text>
                {!!item.description && (
                    <Text style={styles.quizDesc} numberOfLines={1}>{item.description}</Text>
                )}
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Icon source="clock-outline" size={13} color="#64748b" />
                        <Text style={styles.metaText}>{item.duration_minutes} phút</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Icon source="help-circle-outline" size={13} color="#64748b" />
                        <Text style={styles.metaText}>{item.question_count ?? 0} câu</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Icon source="check-decagram-outline" size={13} color="#64748b" />
                        <Text style={styles.metaText}>{item.pass_mark}% đạt</Text>
                    </View>
                </View>
                <Chip
                    style={[styles.chip, { backgroundColor: item.is_active ? "#dcfce7" : "#f1f5f9", alignSelf: "flex-start" }]}
                    textStyle={{ color: item.is_active ? "#16a34a" : "#64748b", fontSize: 10, fontWeight: "700" }}
                    compact
                >
                    {item.is_active ? "Đang mở" : "Đã đóng"}
                </Chip>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#e0e7ff" }]} onPress={() => openQuestions(item)}>
                    <Icon source="format-list-bulleted" size={17} color="#4338ca" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#ede9fe" }]} onPress={() => openEditQuiz(item)}>
                    <Icon source="pencil-outline" size={17} color="#4f46e5" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#fee2e2" }]} onPress={() => handleDeleteQuiz(item)}>
                    <Icon source="trash-can-outline" size={17} color="#dc2626" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    // ── Render: Question Item ──────────────────────────────
    const renderQuestionItem = ({ item, index }) => (
        <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
                <View style={styles.questionIndexBadge}>
                    <Text style={styles.questionIndexText}>{index + 1}</Text>
                </View>
                <Text style={styles.questionContent} numberOfLines={3}>{item.content}</Text>
                <View style={styles.questionActions}>
                    <TouchableOpacity onPress={() => openEditQuestion(item)} style={[styles.actionBtn, { backgroundColor: "#ede9fe" }]}>
                        <Icon source="pencil-outline" size={15} color="#4f46e5" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteQuestion(item)} style={[styles.actionBtn, { backgroundColor: "#fee2e2" }]}>
                        <Icon source="trash-can-outline" size={15} color="#dc2626" />
                    </TouchableOpacity>
                </View>
            </View>
            {item.choices?.map((c, i) => (
                <View key={i} style={[styles.choiceRow, c.is_correct && styles.choiceCorrect]}>
                    <Icon
                        source={c.is_correct ? "check-circle" : "circle-outline"}
                        size={15}
                        color={c.is_correct ? "#16a34a" : "#94a3b8"}
                    />
                    <Text style={[styles.choiceText, c.is_correct && styles.choiceTextCorrect]}>
                        {c.text}
                    </Text>
                </View>
            ))}
        </View>
    );

    // ── Render: Quiz Form Modal ────────────────────────────
  const renderQuizModal = () => (
        <Portal>
            <Modal visible={quizModal} onDismiss={closeQuizModal} contentContainerStyle={styles.modal}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={styles.modalTitle}>
                            {editTarget ? "✏️ Chỉnh sửa Quiz" : "➕ Thêm Quiz mới"}
                        </Text>
                        <Divider style={{ marginBottom: 16 }} />

                        {/* Missing Title Input Restored */}
                        <TextInput
                            label="Tiêu đề bài kiểm tra *"
                            value={quizForm.title}
                            onChangeText={(v) => setQuizForm((f) => ({ ...f, title: v }))}
                            mode="outlined"
                            style={styles.input}
                            outlineColor="#e2e8f0"
                            activeOutlineColor="#4f46e5"
                        />

                        {/* Grouped Time Limit and Passing Score into a Row */}
                        <View style={styles.row2}>
                            <TextInput
                                label="Thời gian (phút) *"
                                value={quizForm.time_limit}
                                onChangeText={(v) => setQuizForm((f) => ({ ...f, time_limit: v }))}
                                keyboardType="numeric"
                                mode="outlined"
                                style={[styles.input, { flex: 1 }]}
                                outlineColor="#e2e8f0"
                                activeOutlineColor="#4f46e5"
                            />
                            <TextInput
                                label="Điểm đạt (%) *"
                                value={quizForm.passing_score}
                                onChangeText={(v) => setQuizForm((f) => ({ ...f, passing_score: v }))}
                                keyboardType="numeric"
                                mode="outlined"
                                style={[styles.input, { flex: 1 }]}
                                outlineColor="#e2e8f0"
                                activeOutlineColor="#4f46e5"
                            />
                        </View>

                        <View style={styles.switchRow}>
                            <View>
                                <Text style={styles.switchLabel}>Trạng thái hoạt động</Text>
                                <Text style={styles.switchSubLabel}>
                                    {quizForm.is_active ? "Học viên có thể làm bài" : "Đang ẩn với học viên"}
                                </Text>
                            </View>
                            <Switch
                                value={quizForm.is_active}
                                onValueChange={(v) => setQuizForm((f) => ({ ...f, is_active: v }))}
                                color="#4f46e5"
                            />
                        </View>

                        <View style={styles.modalBtns}>
                            <Button mode="outlined" onPress={closeQuizModal} style={styles.btnCancel} textColor="#64748b">Huỷ</Button>
                            <Button mode="contained" onPress={handleSaveQuiz} loading={saving} disabled={saving} style={styles.btnSave} buttonColor="#4f46e5">
                                {editTarget ? "Cập nhật" : "Thêm mới"}
                            </Button>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>
        </Portal>
    );

    // ── Render: Question Form Modal ────────────────────────
    const renderQuestionModal = () => (
        <Portal>
            <Modal visible={questionModal} onDismiss={closeQuestionModal} contentContainerStyle={styles.modal}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={styles.modalTitle}>
                            {editQuestion ? "✏️ Sửa câu hỏi" : "➕ Thêm câu hỏi"}
                        </Text>
                        <Divider style={{ marginBottom: 16 }} />

                        <TextInput
                            label="Nội dung câu hỏi *"
                            value={questionForm.content}
                            onChangeText={(v) => setQuestionForm((f) => ({ ...f, content: v }))}
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                            style={styles.input}
                            outlineColor="#e2e8f0"
                            activeOutlineColor="#4f46e5"
                        />

                        <Text style={styles.fieldLabel}>Các lựa chọn (chọn đáp án đúng)</Text>
                        {questionForm.choices.map((c, idx) => (
                            <View key={idx} style={styles.choiceInputRow}>
                                <TouchableOpacity
                                    onPress={() => setCorrectChoice(idx)}
                                    style={styles.radioBtn}
                                >
                                    <Icon
                                        source={c.is_correct ? "radiobox-marked" : "radiobox-blank"}
                                        size={22}
                                        color={c.is_correct ? "#4f46e5" : "#94a3b8"}
                                    />
                                </TouchableOpacity>
                                <TextInput
                                    placeholder={`Lựa chọn ${idx + 1}`}
                                    value={c.text}
                                    onChangeText={(v) => setChoiceText(idx, v)}
                                    mode="outlined"
                                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                    outlineColor={c.is_correct ? "#4f46e5" : "#e2e8f0"}
                                    activeOutlineColor="#4f46e5"
                                    dense
                                />
                            </View>
                        ))}

                        <TextInput
                            label="Giải thích đáp án (tuỳ chọn)"
                            value={questionForm.explanation}
                            onChangeText={(v) => setQuestionForm((f) => ({ ...f, explanation: v }))}
                            mode="outlined"
                            multiline
                            numberOfLines={2}
                            style={[styles.input, { marginTop: 8 }]}
                            outlineColor="#e2e8f0"
                            activeOutlineColor="#4f46e5"
                        />

                        <View style={styles.modalBtns}>
                            <Button mode="outlined" onPress={closeQuestionModal} style={styles.btnCancel} textColor="#64748b">Huỷ</Button>
                            <Button mode="contained" onPress={handleSaveQuestion} loading={questionSaving} disabled={questionSaving} style={styles.btnSave} buttonColor="#4f46e5">
                                {editQuestion ? "Cập nhật" : "Thêm câu hỏi"}
                            </Button>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>
        </Portal>
    );

    // ── QUESTION PANEL (inline, not a separate screen) ─────
    if (selectedQuiz) {
        return (
            <View style={styles.screen}>
                <Header
                    title={`Câu hỏi: ${selectedQuiz.title}`}
                    subtitle={`${questions.length} câu hỏi`}
                    showBack
                    onBack={closeQuestions}
                />

                {questionsLoading ? (
                    <Loading text="Đang tải câu hỏi..." />
                ) : (
                    <FlatList
                        data={questions}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.list}
                        renderItem={renderQuestionItem}
                        ListHeaderComponent={
                            <Text style={styles.hint}>{questions.length} câu hỏi trong bài kiểm tra</Text>
                        }
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <Icon source="help-circle-outline" size={52} color="#cbd5e1" />
                                <Text style={styles.emptyText}>Chưa có câu hỏi nào.</Text>
                                <Text style={styles.emptySubText}>Nhấn "+" để thêm câu hỏi đầu tiên.</Text>
                            </View>
                        }
                    />
                )}

                <TouchableOpacity style={styles.fab} onPress={openCreateQuestion}>
                    <Icon source="plus" size={28} color="#fff" />
                </TouchableOpacity>

                {renderQuestionModal()}
            </View>
        );
    }

    // ── QUIZ LIST ──────────────────────────────────────────
    return (
        <View style={styles.screen}>
            <Header title="Quản lý bài kiểm tra" subtitle={courseTitle ?? ""} showBack />

            {loading ? (
                <Loading text="Đang tải danh sách Quiz..." />
            ) : (
                <FlatList
                    data={quizzes}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    renderItem={renderQuizItem}
                    ListHeaderComponent={
                        <Text style={styles.hint}>{quizzes.length} bài kiểm tra trong khoá học</Text>
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Icon source="clipboard-text-outline" size={52} color="#cbd5e1" />
                            <Text style={styles.emptyText}>Chưa có bài kiểm tra nào.</Text>
                            <Text style={styles.emptySubText}>Nhấn "+" để tạo bài quiz đầu tiên.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={openCreateQuiz}>
                <Icon source="plus" size={28} color="#fff" />
            </TouchableOpacity>

            {renderQuizModal()}
        </View>
    );
};

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f8fafc" },
    list:   { padding: 16, paddingBottom: 100 },
    hint:   { fontSize: 13, color: "#94a3b8", marginBottom: 12, fontWeight: "500" },

    // Quiz Card
    card: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: 14,
        marginBottom: 12,
        padding: 12,
        paddingLeft: 0,
        gap: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        overflow: "hidden",
        alignItems: "center",
    },
    statusBar: {
        width: 5,
        alignSelf: "stretch",
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
    },
    cardBody: { flex: 1, gap: 6, paddingVertical: 2 },
    quizTitle:  { fontSize: 15, fontWeight: "700", color: "#0f172a", lineHeight: 22 },
    quizDesc:   { fontSize: 12, color: "#64748b" },
    metaRow:    { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    metaItem:   { flexDirection: "row", alignItems: "center", gap: 4 },
    metaText:   { fontSize: 12, color: "#64748b", fontWeight: "500" },
    chip:       { borderRadius: 6 },
    actions:    { flexDirection: "column", gap: 6, paddingRight: 6 },
    actionBtn:  { width: 30, height: 30, borderRadius: 8, justifyContent: "center", alignItems: "center" },

    // Question Card
    questionCard: {
        backgroundColor: "#fff",
        borderRadius: 14,
        marginBottom: 12,
        padding: 14,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        gap: 8,
    },
    questionHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
    },
    questionIndexBadge: {
        width: 26, height: 26, borderRadius: 8,
        backgroundColor: "#ede9fe",
        justifyContent: "center", alignItems: "center",
        marginTop: 1,
    },
    questionIndexText: { fontSize: 12, fontWeight: "700", color: "#4f46e5" },
    questionContent: { flex: 1, fontSize: 14, fontWeight: "600", color: "#0f172a", lineHeight: 21 },
    questionActions: { flexDirection: "row", gap: 6 },
    choiceRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: "#f8fafc",
    },
    choiceCorrect: { backgroundColor: "#f0fdf4" },
    choiceText:    { fontSize: 13, color: "#334155", flex: 1 },
    choiceTextCorrect: { color: "#16a34a", fontWeight: "600" },

    // Question Form
    choiceInputRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
    },
    radioBtn: { paddingTop: 4 },

    // FAB
    fab: {
        position: "absolute", bottom: 24, right: 24,
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: "#4f46e5",
        justifyContent: "center", alignItems: "center",
        elevation: 6,
        shadowColor: "#4f46e5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
    },

    // Empty
    empty:        { alignItems: "center", marginTop: 80, gap: 10 },
    emptyText:    { fontSize: 16, color: "#94a3b8", fontWeight: "600" },
    emptySubText: { fontSize: 13, color: "#cbd5e1" },

    // Modal
    modal: {
        margin: 16,
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        maxHeight: "92%",
    },
    modalTitle:  { fontSize: 17, fontWeight: "800", color: "#0f172a", marginBottom: 12 },
    fieldLabel:  { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 8 },
    input:       { backgroundColor: "#fff", marginBottom: 10 },
    row2:        { flexDirection: "row", gap: 10 },

    switchRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        marginTop: 4,
    },
    switchLabel:    { fontSize: 14, fontWeight: "600", color: "#0f172a" },
    switchSubLabel: { fontSize: 12, color: "#64748b", marginTop: 2 },

    modalBtns: { flexDirection: "row", gap: 10, marginTop: 20 },
    btnCancel: { flex: 1, borderColor: "#e2e8f0" },
    btnSave:   { flex: 1 },
});

export default ManageQuizScreen;
