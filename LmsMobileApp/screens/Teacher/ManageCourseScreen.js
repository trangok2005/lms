import React, { useState, useCallback } from "react";
import {
    View, FlatList, StyleSheet, TouchableOpacity,
    Alert, ScrollView, KeyboardAvoidingView, Platform, Image
} from "react-native";
import {
    Text, Icon, Modal, Portal, TextInput,
    Button, Chip, Divider,
} from "react-native-paper";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";

// Assuming you have these in your config
import { authApis, endpoints } from "../../configs/Apis";
import { Header, Loading } from "../../components/common";

// ── Constants ──────────────────────────────────────────────
const COURSE_LEVELS = [
    { value: "beginner",     label: "Dễ",         color: "#16a34a", bg: "#dcfce7" },
    { value: "intermediate", label: "Trung bình", color: "#ca8a04", bg: "#fef9c3" },
    { value: "advanced",     label: "Nâng cao",   color: "#dc2626", bg: "#fee2e2" },
];

const EMPTY_FORM = {
    subject: "", 
    description: "", 
    price: "0", 
    level: "beginner", 
    category_id: "", // Storing category ID for simplicity in this form
    image: null,
};

// ── Helpers ───────────────────────────────────────────────
const levelInfo = (v) => COURSE_LEVELS.find((l) => l.value === v) ?? COURSE_LEVELS[0];

// ── Main Component ───────────────────────────────────────
const ManageCourseScreen = () => {
    const navigation = useNavigation();

    const [courses, setCourses]       = useState([]);
    const [loading, setLoading]       = useState(true);
    const [saving, setSaving]         = useState(false);
    const [modalVisible, setModal]    = useState(false);
    const [editTarget, setEditTarget] = useState(null); // null = create new
    const [form, setForm]             = useState(EMPTY_FORM);

    // ── Fetch Data ─────────────────────────────────────────
    const fetchCourses = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            // Assuming API 6: /api/courses/my-courses/ returns courses of this teacher
           const res = await authApis(token).get(endpoints["my-courses"]);
            const list = res.data.results ?? res.data;
            setCourses(Array.isArray(list) ? list : []);
        } catch (ex) {
            console.error("Fetch courses error:", ex);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchCourses(); }, []));

    // ── Modal Handlers ─────────────────────────────────────
    const openCreate = () => {
        setEditTarget(null);
        setForm(EMPTY_FORM);
        setModal(true);
    };

    const openEdit = (item) => {
        setEditTarget(item);
        setForm({
            subject:     item.subject ?? "",
            description: item.description ?? "",
            price:       String(item.price ?? "0"),
            level:       item.level ?? "beginner",
            category_id: String(item.category?.id ?? ""),
            image:       null, // Require selecting a new image if they want to update it
        });
        setModal(true);
    };

    const closeModal = () => { 
        setModal(false); 
        setEditTarget(null); 
    };

    // ── Image Picker ───────────────────────────────────────
    // Using DocumentPicker for images to keep consistency with your material code
    const pickImage = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "image/*", // Restrict to images
                copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets?.length) {
                setForm((f) => ({ ...f, image: result.assets[0] }));
            }
        } catch (ex) {
            Alert.alert("Lỗi", "Không thể chọn ảnh.");
        }
    };

    // ── Save (Create / Update) ─────────────────────────────
    const handleSave = async () => {
        if (!form.subject.trim()) {
            Alert.alert("Thiếu thông tin", "Vui lòng nhập tên khóa học.");
            return;
        }

        try {
            setSaving(true);
            const token = await AsyncStorage.getItem("token");
            const api   = authApis(token);

            const data = new FormData();
            data.append("subject", form.subject.trim());
            data.append("description", form.description.trim());
            data.append("price", form.price);
            data.append("level", form.level);
            
            if (form.category_id) {
                data.append("category", form.category_id);
            }
            
            if (form.image) {
                data.append("image", {
                    uri:  form.image.uri,
                    name: form.image.name,
                    type: form.image.mimeType ?? "image/jpeg",
                });
            }

            if (editTarget) {
                // Update course
                await api.patch(endpoints["course-partial-update"](editTarget.id), data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                Alert.alert("✅ Đã cập nhật", "Khóa học đã được cập nhật.");
            } else {
                // Create course
                await api.post(endpoints["course-create"](), data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                Alert.alert("✅ Đã thêm", "Khóa học mới đã được tạo.");
            }

            closeModal();
            fetchCourses();
        } catch (ex) {
            console.error("Save course error:", ex?.response?.data ?? ex);
            Alert.alert("Lỗi", "Không thể lưu khóa học. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ─────────────────────────────────────────────
    const handleDelete = (item) => {
        Alert.alert(
            "Xoá khóa học",
            `Bạn có chắc muốn xoá khóa học "${item.subject}"?`,
            [
                { text: "Huỷ", style: "cancel" },
                {
                    text: "Xoá", style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem("token");
                            await authApis(token).delete(endpoints["course-delete"](item.id));
                            fetchCourses();
                        } catch {
                            Alert.alert("Lỗi", "Không thể xoá khóa học.");
                        }
                    },
                },
            ]
        );
    };

    // ── Render Item (Course Card) ──────────────────────────
    const renderItem = ({ item }) => {
        const level = levelInfo(item.level);

        return (
            <TouchableOpacity 
                style={styles.card} 
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ManageMaterial', { 
                    courseId: item.id, 
                    courseTitle: item.subject 
                })}
            >
                {/* Course Cover Image */}
                <Image 
                    source={{ uri: item.image || "https://via.placeholder.com/150" }} 
                    style={styles.courseImage} 
                />

                {/* Course Info */}
                <View style={styles.cardBody}>
                    <Text style={styles.courseTitle} numberOfLines={2}>
                        {item.subject}
                    </Text>
                    
                    <Text style={styles.priceText}>
                        {parseFloat(item.price) > 0 ? `${item.price} VNĐ` : "Miễn phí"}
                    </Text>

                    <View style={styles.chipRow}>
                        <Chip
                            style={[styles.chip, { backgroundColor: level.bg }]}
                            textStyle={{ color: level.color, fontSize: 10, fontWeight: "700" }}
                            compact
                        >
                            {level.label}
                        </Chip>
                        {item.category && (
                            <Chip
                                style={[styles.chip, { backgroundColor: "#f1f5f9" }]}
                                textStyle={{ color: "#475569", fontSize: 10, fontWeight: "600" }}
                                compact
                            >
                                {item.category.name}
                            </Chip>
                        )}
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                        <Icon source="pencil-outline" size={18} color="#4f46e5" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                        <Icon source="trash-can-outline" size={18} color="#dc2626" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
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
                            {editTarget ? "✏️ Chỉnh sửa khóa học" : "➕ Thêm khóa học mới"}
                        </Text>
                        <Divider style={{ marginBottom: 16 }} />

                        {/* Subject Input */}
                        <TextInput
                            label="Tên khóa học *"
                            value={form.subject}
                            onChangeText={(v) => setForm((f) => ({ ...f, subject: v }))}
                            mode="outlined"
                            style={styles.input}
                            outlineColor="#e2e8f0"
                            activeOutlineColor="#4f46e5"
                        />

                        {/* Description Input */}
                        <TextInput
                            label="Mô tả"
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
                            {/* Price Input */}
                            <TextInput
                                label="Giá (VNĐ)"
                                value={form.price}
                                onChangeText={(v) => setForm((f) => ({ ...f, price: v }))}
                                keyboardType="numeric"
                                mode="outlined"
                                style={[styles.input, { flex: 1 }]}
                                outlineColor="#e2e8f0"
                                activeOutlineColor="#4f46e5"
                            />
                            {/* Category ID (Can be replaced with a Dropdown later) */}
                            <TextInput
                                label="ID Danh mục"
                                value={form.category_id}
                                onChangeText={(v) => setForm((f) => ({ ...f, category_id: v }))}
                                keyboardType="numeric"
                                mode="outlined"
                                style={[styles.input, { flex: 1 }]}
                                outlineColor="#e2e8f0"
                                activeOutlineColor="#4f46e5"
                            />
                        </View>

                        {/* Level Segment */}
                        <Text style={styles.fieldLabel}>Cấp độ *</Text>
                        <View style={styles.segmentRow}>
                            {COURSE_LEVELS.map((lvl) => (
                                <TouchableOpacity
                                    key={lvl.value}
                                    style={[
                                        styles.segment,
                                        form.level === lvl.value && { backgroundColor: lvl.color, borderColor: lvl.color },
                                    ]}
                                    onPress={() => setForm((f) => ({ ...f, level: lvl.value }))}
                                >
                                    <Text style={[
                                        styles.segmentText,
                                        form.level === lvl.value && styles.segmentTextActive,
                                    ]}>
                                        {lvl.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Image Picker */}
                        <TouchableOpacity style={styles.filePicker} onPress={pickImage}>
                            <Icon
                                source={form.image ? "check-circle" : "image-outline"}
                                size={20}
                                color={form.image ? "#16a34a" : "#4f46e5"}
                            />
                            <Text style={[styles.filePickerText, form.image && { color: "#16a34a" }]}>
                                {form.image
                                    ? `✔ ${form.image.name}`
                                    : editTarget
                                        ? "Thay đổi ảnh bìa (tuỳ chọn)"
                                        : "Chọn ảnh bìa *"}
                            </Text>
                        </TouchableOpacity>

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
                title="Quản lý khóa học"
                showBack
            />

            {loading ? (
                <Loading text="Đang tải khóa học..." />
            ) : (
                <FlatList
                    data={courses}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    renderItem={renderItem}
                    ListHeaderComponent={
                        <Text style={styles.hint}>
                            Bạn đang quản lý {courses.length} khóa học
                        </Text>
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Icon source="bookshelf" size={52} color="#cbd5e1" />
                            <Text style={styles.emptyText}>Chưa có khóa học nào.</Text>
                            <Text style={styles.emptySubText}>Nhấn "+" để tạo khóa học mới.</Text>
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

    hint: { fontSize: 13, color: "#94a3b8", marginBottom: 12, fontWeight: "500" },

    // Card Styles
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 14,
        marginBottom: 12,
        padding: 12,
        gap: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
    },
    courseImage: {
        width: 80, 
        height: 80, 
        borderRadius: 10,
        backgroundColor: "#e2e8f0"
    },
    cardBody:      { flex: 1, gap: 4, justifyContent: 'center' },
    courseTitle:   { fontSize: 15, fontWeight: "700", color: "#0f172a", lineHeight: 22 },
    priceText:     { fontSize: 13, fontWeight: "600", color: "#16a34a" },
    chipRow:       { flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center", marginTop: 4 },
    chip:          { borderRadius: 6, height: 22 },
    actions:       { flexDirection: "column", gap: 8 },
    editBtn: {
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: "#ede9fe",
        justifyContent: "center", alignItems: "center",
    },
    deleteBtn: {
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: "#fee2e2",
        justifyContent: "center", alignItems: "center",
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
    fieldLabel:  { fontSize: 13, fontWeight: "600", color: "#475569", marginTop: 12, marginBottom: 6 },
    input:       { backgroundColor: "#fff", marginBottom: 10 },
    row2:        { flexDirection: "row", gap: 10 },

    segmentRow:  { flexDirection: "row", gap: 8, marginBottom: 4 },
    segment: {
        flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 4, paddingVertical: 10, borderRadius: 10,
        borderWidth: 1.5, borderColor: "#e2e8f0",
        backgroundColor: "#f8fafc",
    },
    segmentText:       { fontSize: 12, fontWeight: "600", color: "#64748b" },
    segmentTextActive: { color: "#fff" },

    filePicker: {
        flexDirection: "row", alignItems: "center", gap: 10,
        borderWidth: 1.5, borderColor: "#4f46e5", borderStyle: "dashed",
        borderRadius: 12, padding: 14, marginTop: 16,
        backgroundColor: "#fafafa",
    },
    filePickerText: { fontSize: 13, color: "#4f46e5", fontWeight: "600", flex: 1 },

    modalBtns:  { flexDirection: "row", gap: 10, marginTop: 24 },
    btnCancel:  { flex: 1, borderColor: "#e2e8f0" },
    btnSave:    { flex: 1 },
});

export default ManageCourseScreen;
