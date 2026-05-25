import React, { useState, useCallback } from "react";
import {
    View, FlatList, StyleSheet, TouchableOpacity,
    Alert, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import {
    Text, Icon, Modal, Portal, TextInput,
    Button, Chip, ActivityIndicator, Divider,
} from "react-native-paper";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";

import { authApis, endpoints } from "../../configs/Apis";
import { Header, Loading } from "../../components/common";

// ── Hằng số ──────────────────────────────────────────────
const MATERIAL_TYPES = [
    { value: "video", label: "Video",    icon: "play-circle-outline" },
    { value: "pdf",   label: "PDF",      icon: "file-pdf-box" },
    { value: "slide", label: "Slide",    icon: "presentation" },
];
const DIFFICULTIES = [
    { value: "easy",   label: "Dễ",          color: "#16a34a", bg: "#dcfce7" },
    { value: "medium", label: "Trung bình",   color: "#ca8a04", bg: "#fef9c3" },
    { value: "hard",   label: "Khó",          color: "#dc2626", bg: "#fee2e2" },
];

const EMPTY_FORM = {
    title: "", material_type: "video", difficulty: "medium",
    duration_minutes: "", order_index: "", file: null,
};

// ── Helpers ───────────────────────────────────────────────
const typeInfo  = (v) => MATERIAL_TYPES.find((t) => t.value === v) ?? MATERIAL_TYPES[0];
const diffInfo  = (v) => DIFFICULTIES.find((d) => d.value === v)   ?? DIFFICULTIES[1];

// ── Component chính ───────────────────────────────────────
const ManageMaterialScreen = () => {
    const navigation = useNavigation();
    const route      = useRoute();
    const { courseId, courseTitle } = route.params ?? {};

    const [materials, setMaterials]   = useState([]);
    const [loading, setLoading]       = useState(true);
    const [saving, setSaving]         = useState(false);
    const [modalVisible, setModal]    = useState(false);
    const [editTarget, setEditTarget] = useState(null); // null = tạo mới
    const [form, setForm]             = useState(EMPTY_FORM);

    // ── Fetch ──────────────────────────────────────────────
    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(endpoints["material-list"](), {
                params: { course: courseId },
            });
            const list = res.data.results ?? res.data;
            setMaterials(Array.isArray(list) ? list : []);
        } catch (ex) {
            console.error("Fetch materials error:", ex);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchMaterials(); }, [courseId]));

    // ── Modal helpers ──────────────────────────────────────
    const openCreate = () => {
        setEditTarget(null);
        setForm(EMPTY_FORM);
        setModal(true);
    };

    const openEdit = (item) => {
        setEditTarget(item);
        setForm({
            title:            item.title ?? "",
            material_type:    item.material_type ?? "video",
            difficulty:       item.difficulty ?? "medium",
            duration_minutes: String(item.duration_minutes ?? ""),
            order_index:      String(item.order_index ?? ""),
            file:             null, // không load lại file cũ
        });
        setModal(true);
    };

    const closeModal = () => { setModal(false); setEditTarget(null); };

    // ── Chọn file ──────────────────────────────────────────
    const pickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ["video/*", "application/pdf", "*/*"],
                copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets?.length) {
                setForm((f) => ({ ...f, file: result.assets[0] }));
            }
        } catch (ex) {
            Alert.alert("Lỗi", "Không thể chọn file.");
        }
    };

    // ── Save (tạo / sửa) ───────────────────────────────────
    const handleSave = async () => {
        if (!form.title.trim()) {
            Alert.alert("Thiếu thông tin", "Vui lòng nhập tiêu đề.");
            return;
        }
        if (!editTarget && !form.file) {
            Alert.alert("Thiếu file", "Vui lòng chọn file tài liệu.");
            return;
        }

        try {
            setSaving(true);
            const token = await AsyncStorage.getItem("token");
            const api   = authApis(token);

            const data = new FormData();
            data.append("title",            form.title.trim());
            data.append("material_type",    form.material_type);
            data.append("difficulty",       form.difficulty);
            data.append("course",           courseId);
            if (form.duration_minutes) data.append("duration_minutes", form.duration_minutes);
            if (form.order_index)      data.append("order_index",      form.order_index);
            if (form.file) {
                data.append("file", {
                    uri:  form.file.uri,
                    name: form.file.name,
                    type: form.file.mimeType ?? "application/octet-stream",
                });
            }

            if (editTarget) {
                await api.patch(endpoints["material-partial-update"](editTarget.id), data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                Alert.alert("✅ Đã cập nhật", "Tài liệu đã được cập nhật.");
            } else {
                await api.post(endpoints["material-create"](), data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                Alert.alert("✅ Đã thêm", "Tài liệu mới đã được tạo.");
            }

            closeModal();
            fetchMaterials();
        } catch (ex) {
            console.error("Save material error:", ex?.response?.data ?? ex);
            Alert.alert("Lỗi", "Không thể lưu tài liệu. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ─────────────────────────────────────────────
    const handleDelete = (item) => {
        Alert.alert(
            "Xoá tài liệu",
            `Bạn có chắc muốn xoá "${item.title}"?`,
            [
                { text: "Huỷ", style: "cancel" },
                {
                    text: "Xoá", style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem("token");
                            await authApis(token).delete(endpoints["material-delete"](item.id));
                            fetchMaterials();
                        } catch {
                            Alert.alert("Lỗi", "Không thể xoá tài liệu.");
                        }
                    },
                },
            ]
        );
    };

    // ── Render item ────────────────────────────────────────
    const renderItem = ({ item, index }) => {
        const type = typeInfo(item.material_type);
        const diff = diffInfo(item.difficulty);

        return (
            <View style={styles.card}>
                {/* Order badge */}
                <View style={styles.orderBadge}>
                    <Text style={styles.orderText}>{item.order_index ?? index + 1}</Text>
                </View>

                {/* Icon loại */}
                <View style={styles.typeIcon}>
                    <Icon source={type.icon} size={26} color="#4f46e5" />
                </View>

                {/* Info */}
                <View style={styles.cardBody}>
                    <Text style={styles.materialTitle} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <View style={styles.chipRow}>
                        <Chip
                            style={[styles.chip, { backgroundColor: diff.bg }]}
                            textStyle={{ color: diff.color, fontSize: 10, fontWeight: "700" }}
                            compact
                        >
                            {diff.label}
                        </Chip>
                        <Chip
                            style={[styles.chip, { backgroundColor: "#ede9fe" }]}
                            textStyle={{ color: "#4f46e5", fontSize: 10, fontWeight: "700" }}
                            compact
                        >
                            {type.label}
                        </Chip>
                        {item.duration_minutes > 0 && (
                            <View style={styles.durationRow}>
                                <Icon source="clock-outline" size={12} color="#94a3b8" />
                                <Text style={styles.durationText}>{item.duration_minutes} phút</Text>
                            </View>
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
            </View>
        );
    };

    // ── Modal form ─────────────────────────────────────────
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
                            {editTarget ? "✏️ Chỉnh sửa tài liệu" : "➕ Thêm tài liệu mới"}
                        </Text>
                        <Divider style={{ marginBottom: 16 }} />

                        {/* Tiêu đề */}
                        <TextInput
                            label="Tiêu đề *"
                            value={form.title}
                            onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                            mode="outlined"
                            style={styles.input}
                            outlineColor="#e2e8f0"
                            activeOutlineColor="#4f46e5"
                        />

                        {/* Loại tài liệu */}
                        <Text style={styles.fieldLabel}>Loại tài liệu *</Text>
                        <View style={styles.segmentRow}>
                            {MATERIAL_TYPES.map((t) => (
                                <TouchableOpacity
                                    key={t.value}
                                    style={[
                                        styles.segment,
                                        form.material_type === t.value && styles.segmentActive,
                                    ]}
                                    onPress={() => setForm((f) => ({ ...f, material_type: t.value }))}
                                >
                                    <Icon
                                        source={t.icon}
                                        size={16}
                                        color={form.material_type === t.value ? "#fff" : "#64748b"}
                                    />
                                    <Text style={[
                                        styles.segmentText,
                                        form.material_type === t.value && styles.segmentTextActive,
                                    ]}>
                                        {t.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Độ khó */}
                        <Text style={styles.fieldLabel}>Độ khó</Text>
                        <View style={styles.segmentRow}>
                            {DIFFICULTIES.map((d) => (
                                <TouchableOpacity
                                    key={d.value}
                                    style={[
                                        styles.segment,
                                        form.difficulty === d.value && { backgroundColor: d.color, borderColor: d.color },
                                    ]}
                                    onPress={() => setForm((f) => ({ ...f, difficulty: d.value }))}
                                >
                                    <Text style={[
                                        styles.segmentText,
                                        form.difficulty === d.value && styles.segmentTextActive,
                                    ]}>
                                        {d.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Thời lượng & thứ tự */}
                        <View style={styles.row2}>
                            <TextInput
                                label="Thời lượng (phút)"
                                value={form.duration_minutes}
                                onChangeText={(v) => setForm((f) => ({ ...f, duration_minutes: v }))}
                                keyboardType="numeric"
                                mode="outlined"
                                style={[styles.input, { flex: 1 }]}
                                outlineColor="#e2e8f0"
                                activeOutlineColor="#4f46e5"
                            />
                            <TextInput
                                label="Thứ tự"
                                value={form.order_index}
                                onChangeText={(v) => setForm((f) => ({ ...f, order_index: v }))}
                                keyboardType="numeric"
                                mode="outlined"
                                style={[styles.input, { flex: 1 }]}
                                outlineColor="#e2e8f0"
                                activeOutlineColor="#4f46e5"
                            />
                        </View>

                        {/* Chọn file */}
                        <TouchableOpacity style={styles.filePicker} onPress={pickFile}>
                            <Icon
                                source={form.file ? "check-circle" : "upload"}
                                size={20}
                                color={form.file ? "#16a34a" : "#4f46e5"}
                            />
                            <Text style={[styles.filePickerText, form.file && { color: "#16a34a" }]}>
                                {form.file
                                    ? `✔ ${form.file.name}`
                                    : editTarget
                                        ? "Chọn file mới (tuỳ chọn)"
                                        : "Chọn file tài liệu *"}
                            </Text>
                        </TouchableOpacity>

                        {/* Buttons */}
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

    // ── Render ─────────────────────────────────────────────
    return (
        <View style={styles.screen}>
            <Header
                title="Quản lý tài liệu"
                subtitle={courseTitle ?? ""}
                showBack
            />

            {loading ? (
                <Loading text="Đang tải tài liệu..." />
            ) : (
                <FlatList
                    data={materials}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    renderItem={renderItem}
                    ListHeaderComponent={
                        <Text style={styles.hint}>
                            {materials.length} tài liệu trong khoá học
                        </Text>
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Icon source="file-outline" size={52} color="#cbd5e1" />
                            <Text style={styles.emptyText}>Chưa có tài liệu nào.</Text>
                            <Text style={styles.emptySubText}>Nhấn "+" để thêm tài liệu mới.</Text>
                        </View>
                    }
                />
            )}

            {/* FAB thêm mới */}
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

    // Card
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 14,
        marginBottom: 10,
        padding: 12,
        gap: 10,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
    },
    orderBadge: {
        width: 28, height: 28, borderRadius: 8,
        backgroundColor: "#f1f5f9",
        justifyContent: "center", alignItems: "center",
    },
    orderText: { fontSize: 12, fontWeight: "700", color: "#64748b" },
    typeIcon: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: "#ede9fe",
        justifyContent: "center", alignItems: "center",
    },
    cardBody:      { flex: 1, gap: 6 },
    materialTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a", lineHeight: 20 },
    chipRow:       { flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center" },
    chip:          { borderRadius: 6, height: 22 },
    durationRow:   { flexDirection: "row", alignItems: "center", gap: 3 },
    durationText:  { fontSize: 11, color: "#94a3b8" },
    actions:       { flexDirection: "column", gap: 6 },
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
        maxHeight: "90%",
    },
    modalTitle:  { fontSize: 17, fontWeight: "800", color: "#0f172a", marginBottom: 12 },
    fieldLabel:  { fontSize: 13, fontWeight: "600", color: "#475569", marginTop: 12, marginBottom: 6 },
    input:       { backgroundColor: "#fff", marginBottom: 8 },
    row2:        { flexDirection: "row", gap: 10 },

    segmentRow:  { flexDirection: "row", gap: 8, marginBottom: 4 },
    segment: {
        flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 4, paddingVertical: 8, borderRadius: 10,
        borderWidth: 1.5, borderColor: "#e2e8f0",
        backgroundColor: "#f8fafc",
    },
    segmentActive:    { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
    segmentText:      { fontSize: 12, fontWeight: "600", color: "#64748b" },
    segmentTextActive: { color: "#fff" },

    filePicker: {
        flexDirection: "row", alignItems: "center", gap: 10,
        borderWidth: 1.5, borderColor: "#4f46e5", borderStyle: "dashed",
        borderRadius: 12, padding: 14, marginTop: 12,
        backgroundColor: "#fafafa",
    },
    filePickerText: { fontSize: 13, color: "#4f46e5", fontWeight: "600", flex: 1 },

    modalBtns:  { flexDirection: "row", gap: 10, marginTop: 20 },
    btnCancel:  { flex: 1, borderColor: "#e2e8f0" },
    btnSave:    { flex: 1 },
});

export default ManageMaterialScreen;
