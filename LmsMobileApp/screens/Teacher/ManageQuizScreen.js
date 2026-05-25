import React, { useState, useCallback } from "react";
import {
    View, FlatList, StyleSheet, TouchableOpacity,
    Alert, ScrollView, KeyboardAvoidingView, Platform
} from "react-native";
import {
    Text, Icon, Modal, Portal, TextInput,
    Button, Chip, Divider, Switch
} from "react-native-paper";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Assuming you have these in your config
// import { authApis, endpoints } from "../../configs/Apis";
import { Header, Loading } from "../../components/common";

// ── Constants ──────────────────────────────────────────────
const EMPTY_FORM = {
    title: "",
    description: "",
    duration_minutes: "15",
    pass_mark: "50",
    is_active: true,
};

// ── Main Component ───────────────────────────────────────
const ManageQuizScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    
    // Get course info passed from the previous screen
    const { courseId, courseTitle } = route.params ?? {};

    const [quizzes, setQuizzes]       = useState([]);
    const [loading, setLoading]       = useState(true);
    const [saving, setSaving]         = useState(false);
    const [modalVisible, setModal]    = useState(false);
    const [editTarget, setEditTarget] = useState(null); // null means creating a new quiz
    const [form, setForm]             = useState(EMPTY_FORM);

    // ── Fetch Data ─────────────────────────────────────────
    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            // TODO: Replace with actual API call
            // const token = await AsyncStorage.getItem("token");
            // const res = await authApis(token).get(endpoints["quiz-list"](), {
            //     params: { course: courseId },
            // });
            // const list = res.data.results ?? res.data;
            // setQuizzes(Array.isArray(list) ? list : []);

            // Mocking API delay and response for demonstration
            setTimeout(() => {
                setQuizzes([
                    {
                        id: 1,
                        title: "Mid-term Assessment",
                        description: "Covers all topics from week 1 to week 4.",
                        duration_minutes: 45,
                        pass_mark: 60,
                        is_active: true,
                        question_count: 20 // Mock count
                    },
                    {
                        id: 2,
                        title: "Quick Pop Quiz",
                        description: "A short quiz to test your memory.",
                        duration_minutes: 10,
                        pass_mark: 50,
                        is_active: false,
                        question_count: 5
                    }
                ]);
                setLoading(false);
            }, 600);
        } catch (ex) {
            console.error("Fetch quizzes error:", ex);
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { 
        if (courseId) fetchQuizzes(); 
    }, [courseId]));

    // ── Modal Handlers ─────────────────────────────────────
    const openCreate = () => {
        setEditTarget(null);
        setForm(EMPTY_FORM);
        setModal(true);
    };

    const openEdit = (item) => {
        setEditTarget(item);
        setForm({
            title:            item.title ?? "",
            description:      item.description ?? "",
            duration_minutes: String(item.duration_minutes ?? "15"),
            pass_mark:        String(item.pass_mark ?? "50"),
            is_active:        item.is_active ?? true,
        });
        setModal(true);
    };

    const closeModal = () => { 
        setModal(false); 
        setEditTarget(null); 
    };

    // ── Save (Create / Update) ─────────────────────────────
    const handleSave = async () => {
        if (!form.title.trim()) {
            Alert.alert("Thiếu thông tin", "Vui lòng nhập tiêu đề bài kiểm tra.");
            return;
        }

        try {
            setSaving(true);
            // TODO: Replace with actual API call
            // const token = await AsyncStorage.getItem("token");
            // const api   = authApis(token);
            // const payload = { ...form, course: courseId };
            
            // if (editTarget) {
            //     await api.patch(endpoints["quiz-partial-update"](editTarget.id), payload);
            //     Alert.alert("✅ Đã cập nhật", "Bài kiểm tra đã được cập nhật.");
            // } else {
            //     await api.post(endpoints["quiz-create"](), payload);
            //     Alert.alert("✅ Đã thêm", "Bài kiểm tra mới đã được tạo.");
            // }

            // Mock success behavior
            setTimeout(() => {
                Alert.alert("Thành công", editTarget ? "Đã cập nhật bài kiểm tra." : "Đã thêm bài kiểm tra mới.");
                closeModal();
                fetchQuizzes();
                setSaving(false);
            }, 500);

        } catch (ex) {
            console.error("Save quiz error:", ex?.response?.data ?? ex);
            Alert.alert("Lỗi", "Không thể lưu bài kiểm tra. Vui lòng thử lại.");
            setSaving(false);
        }
    };

    // ── Delete ─────────────────────────────────────────────
    const handleDelete = (item) => {
        Alert.alert(
            "Xoá bài kiểm tra",
            `Bạn có chắc muốn xoá "${item.title}"? Dữ liệu câu hỏi bên trong cũng sẽ bị xoá.`,
            [
                { text: "Huỷ", style: "cancel" },
                {
                    text: "Xoá", style: "destructive",
                    onPress: async () => {
                        try {
                            // TODO: Replace with actual API call
                            // const token = await AsyncStorage.getItem("token");
                            // await authApis(token).delete(endpoints["quiz-delete"](item.id));
                            fetchQuizzes(); // Refresh list
                        } catch {
                            Alert.alert("Lỗi", "Không thể xoá bài kiểm tra.");
                        }
                    },
                },
            ]
        );
    };

    // ── Navigate to Questions ──────────────────────────────
    const handleManageQuestions = (quiz) => {
        // Navigate to a dedicated screen for managing questions of this specific quiz
        // navigation.navigate("ManageQuestions", { quizId: quiz.id, quizTitle: quiz.title });
        Alert.alert("Chuyển hướng", `Chuyển sang màn hình quản lý câu hỏi cho: ${quiz.title}`);
    };

    // ── Render Item (Quiz Card) ────────────────────────────
    const renderItem = ({ item }) => {
        return (
            <View style={styles.card}>
                {/* Status Indicator (Left Border Concept) */}
                <View style={[styles.statusIndicator, { backgroundColor: item.is_active ? '#16a34a' : '#94a3b8' }]} />

                <View style={styles.cardBody}>
                    <Text style={styles.quizTitle} numberOfLines={2}>
                        {item.title}
                    </Text>
                    
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Icon source="clock-outline" size={14} color="#64748b" />
                            <Text style={styles.metaText}>{item.duration_minutes} phút</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Icon source="help-circle-outline" size={14} color="#64748b" />
                            <Text style={styles.metaText}>{item.question_count} câu hỏi</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Icon source="check-decagram-outline" size={14} color="#64748b" />
                            <Text style={styles.metaText}>{item.pass_mark}% đạt</Text>
                        </View>
                    </View>

                    <View style={styles.chipRow}>
                        <Chip
                            style={[styles.chip, { backgroundColor: item.is_active ? "#dcfce7" : "#f1f5f9" }]}
                            textStyle={{ color: item.is_active ? "#16a34a" : "#64748b", fontSize: 10, fontWeight: "700" }}
                            compact
                        >
                            {item.is_active ? "Đang mở" : "Đã đóng"}
                        </Chip>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: '#e0e7ff' }]} 
                        onPress={() => handleManageQuestions(item)}
                    >
                        <Icon source="format-list-bulleted" size={18} color="#4338ca" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: '#ede9fe' }]} 
                        onPress={() => openEdit(item)}
                    >
                        <Icon source="pencil-outline" size={18} color="#4f46e5" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]} 
                        onPress={() => handleDelete(item)}
                    >
                        <Icon source="trash-can-outline" size={18} color="#dc2626" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // ── Render Modal Form ──────────────────────────────────
    const renderModal = () => (
        <Portal>
            <Modal
                visible={modalVisible}
                onDismiss={closeModal}
                contentContainerStyle={styles.modal}
            >
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={styles.modalTitle}>
                            {editTarget ? "✏️ Chỉnh sửa Quiz" : "➕ Thêm Quiz mới"}
                        </Text>
                        <Divider style={{ marginBottom: 16 }} />

                        {/* Title Input */}
                        <TextInput
                            label="Tiêu đề *"
                            value={form.title}
                            onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                            mode="outlined"
                            style={styles.input}
                            outlineColor="#e2e8f0"
                            activeOutlineColor="#4f46e5"
                        />

                        {/* Description Input */}
                        <TextInput
                            label="Mô tả hướng dẫn"
                            value={form.description}
                            onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                            style={styles.input}
                            outlineColor="#e2e8f0"
                            activeOutlineColor="#4f46e5"
                        />

                        <View style={styles.row2}>
                            {/* Duration Input */}
                            <TextInput
                                label="Thời gian (phút) *"
                                value={form.duration_minutes}
                                onChangeText={(v) => setForm((f) => ({ ...f, duration_minutes: v }))}
                                keyboardType="numeric"
                                mode="outlined"
                                style={[styles.input, { flex: 1 }]}
                                outlineColor="#e2e8f0"
                                activeOutlineColor="#4f46e5"
                            />
                            {/* Pass Mark Input */}
                            <TextInput
                                label="Điểm đạt (%) *"
                                value={form.pass_mark}
                                onChangeText={(v) => setForm((f) => ({ ...f, pass_mark: v }))}
                                keyboardType="numeric"
                                mode="outlined"
                                style={[styles.input, { flex: 1 }]}
                                outlineColor="#e2e8f0"
                                activeOutlineColor="#4f46e5"
                            />
                        </View>

                        {/* Status Toggle */}
                        <View style={styles.switchRow}>
                            <View>
                                <Text style={styles.switchLabel}>Trạng thái hoạt động</Text>
                                <Text style={styles.switchSubLabel}>
                                    {form.is_active ? "Học viên có thể làm bài" : "Đang ẩn với học viên"}
                                </Text>
                            </View>
                            <Switch
                                value={form.is_active}
                                onValueChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                                color="#4f46e5"
                            />
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.modalBtns}>
                            <Button
                                mode="outlined"
                                onPress={closeModal}
                                style={styles.btnCancel}
                                textColor="#64748b"
                            >
                                Huỷ
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleSave}
                                loading={saving}
                                disabled={saving}
                                style={styles.btnSave}
                                buttonColor="#4f46e5"
                            >
                                {editTarget ? "Cập nhật" : "Thêm mới"}
                            </Button>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>
        </Portal>
    );

    // ── Main Render ─────────────────────────────────────────
    return (
        <View style={styles.screen}>
            <Header
                title="Quản lý bài kiểm tra"
                subtitle={courseTitle ?? ""}
                showBack
            />

            {loading ? (
                <Loading text="Đang tải danh sách Quiz..." />
            ) : (
                <FlatList
                    data={quizzes}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    renderItem={renderItem}
                    ListHeaderComponent={
                        <Text style={styles.hint}>
                            {quizzes.length} bài kiểm tra trong khoá học
                        </Text>
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

            {/* Floating Action Button */}
            <TouchableOpacity style={styles.fab} onPress={openCreate}>
                <Icon source="plus" size={28} color="#fff" />
            </TouchableOpacity>

            {renderModal()}
        </View>
    );
};

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f8fafc" },
    list:   { padding: 16, paddingBottom: 100 },
    hint:   { fontSize: 13, color: "#94a3b8", marginBottom: 12, fontWeight: "500" },

    // Card Styles
    card: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: 14,
        marginBottom: 12,
        padding: 12,
        paddingLeft: 0, // Adjusted to accommodate status indicator
        gap: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        overflow: 'hidden',
    },
    statusIndicator: {
        width: 6,
        height: '120%', 
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
    },
    cardBody: { 
        flex: 1, 
        justifyContent: 'center',
        paddingVertical: 4,
    },
    quizTitle: { 
        fontSize: 15, 
        fontWeight: "700", 
        color: "#0f172a", 
        lineHeight: 22,
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 8,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: "#64748b",
        fontWeight: "500",
    },
    chipRow: { 
        flexDirection: "row", 
        alignItems: "center" 
    },
    chip: { 
        borderRadius: 6, 
        height: 22 
    },
    actions: { 
        flexDirection: "column", 
        justifyContent: 'space-between',
        gap: 8,
        paddingRight: 4,
    },
    actionBtn: {
        width: 32, 
        height: 32, 
        borderRadius: 8,
        justifyContent: "center", 
        alignItems: "center",
    },

    // FAB Styles
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

    // Empty State Styles
    empty:        { alignItems: "center", marginTop: 80, gap: 10 },
    emptyText:    { fontSize: 16, color: "#94a3b8", fontWeight: "600" },
    emptySubText: { fontSize: 13, color: "#cbd5e1" },

    // Modal Styles
    modal: {
        margin: 16,
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        maxHeight: "90%",
    },
    modalTitle:  { fontSize: 17, fontWeight: "800", color: "#0f172a", marginBottom: 12 },
    input:       { backgroundColor: "#fff", marginBottom: 12 },
    row2:        { flexDirection: "row", gap: 10 },
    
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginTop: 8,
    },
    switchLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
    },
    switchSubLabel: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },

    modalBtns:  { flexDirection: "row", gap: 10, marginTop: 24 },
    btnCancel:  { flex: 1, borderColor: "#e2e8f0" },
    btnSave:    { flex: 1 },
});

export default ManageQuizScreen;
