import React, { useState, useCallback } from "react";
import {
    View, FlatList, StyleSheet, TouchableOpacity,
    Alert, ScrollView, KeyboardAvoidingView, Platform,
    Image
} from "react-native";
import {
    Text, Icon, Modal, Portal, TextInput,
    Button, Chip, Divider, Searchbar
} from "react-native-paper";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

import { authApis, endpoints } from "../../configs/Apis";
import { Header, Loading } from "../../components/common";


const MATERIAL_TYPES = [
    { value: "video", label: "Video",    icon: "play-circle-outline" },
    { value: "pdf",   label: "PDF",      icon: "file-pdf-box" },
    { value: "slide", label: "Slide",    icon: "presentation" },
];

const DIFFICULTIES = [
    { value: "easy",   label: "Dễ",         color: "#16a34a", bg: "#dcfce7" },
    { value: "medium", label: "Trung bình", color: "#ca8a04", bg: "#fef9c3" },
    { value: "hard",   label: "Khó",        color: "#dc2626", bg: "#fee2e2" },
];

const EMPTY_FORM = {
    title: "",
    content: "",
    material_type: "video",
    difficulty: "medium",
    duration_minutes: "",
    order_index: "",
    file: null,
    thumbnail: null,
    existingThumb: null
};


const getTypeInfo = (v) => MATERIAL_TYPES.find((t) => t.value === v) ?? MATERIAL_TYPES[0];
const getDiffInfo = (v) => DIFFICULTIES.find((d) => d.value === v) ?? DIFFICULTIES[1];


const ManageMaterialScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();

    const params = route.params ?? {};
    const courseId = params.courseId ?? params.course?.id;
    const courseTitle = params.courseTitle ?? params.course?.subject ?? params.course?.title ?? "Tài liệu";

    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalVisible, setModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);


    const fetchMaterials = async (query = "") => {
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(endpoints["material-list"](), {
                params: {
                    course: courseId,
                    q: query.trim() || undefined
                },
            });
            const list = res.data.results ?? res.data;
            setMaterials(Array.isArray(list) ? list : []);
        } catch (ex) {
            console.error("Fetch materials error:", ex?.response?.data ?? ex.message);
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    };

    useFocusEffect(useCallback(() => {
        setLoading(true);
        fetchMaterials(searchQuery);
    }, [courseId]));

    const handleSearchSubmit = () => {
        setIsSearching(true);
        fetchMaterials(searchQuery);
    };

    const handleClearSearch = () => {
        setSearchQuery("");
        setIsSearching(true);
        fetchMaterials("");
    };


    const openCreate = () => {
        setEditTarget(null);
        setForm(EMPTY_FORM);
        setModal(true);
    };

    const openEdit = (item) => {
        setEditTarget(item);
        setForm({
            title:            item.title ?? "",
            content:          item.content ?? "",
            material_type:    item.material_type ?? "video",
            difficulty:       item.difficulty ?? "medium",
            duration_minutes: String(item.duration_minutes ?? ""),
            order_index:      String(item.order_index ?? ""),
            file:             null,
            thumbnail:        null,
            existingThumb:    item.thumbnail ?? null
        });
        setModal(true);
    };

    const closeModal = () => {
        setModal(false);
        setEditTarget(null);
    };


    const pickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ["video/*", "application/pdf", "*/*"],
                copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets?.length) {
                setForm((prev) => ({ ...prev, file: result.assets[0] }));
            }
        } catch {
            Alert.alert("Error", "Could not pick the document file.");
        }
    };

    const pickThumbnail = async () => {
        try {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
                Alert.alert("Permission required", "Please allow access to your photo library.");
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });
            if (!result.canceled) {
                setForm((prev) => ({ ...prev, thumbnail: result.assets[0], existingThumb: null }));
            }
        } catch {
            Alert.alert("Error", "Could not pick thumbnail image.");
        }
    };


    const handleSave = async () => {
        if (!form.title.trim()) {
            Alert.alert("Required", "Vui lòng nhập tiêu đề tài liệu.");
            return;
        }
        if (!editTarget && !form.file) {
            Alert.alert("Required", "Vui lòng chọn file để upload.");
            return;
        }

        try {
            setSaving(true);
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);

            const data = new FormData();
            data.append("title", form.title.trim());
            data.append("material_type", form.material_type);
            data.append("difficulty", form.difficulty);

            if (!courseId || isNaN(Number(courseId))) {
                Alert.alert("Lỗi dữ liệu", "Không tìm thấy ID khóa học hợp lệ.");
                setSaving(false);
                return;
            }
            data.append("course", courseId);

            if (form.content) data.append("content", form.content.trim());
            if (form.duration_minutes) data.append("duration_minutes", form.duration_minutes);
            if (form.order_index) data.append("order_index", form.order_index);

            if (form.file) {
                data.append("file", {
                    uri: form.file.uri,
                    name: form.file.name,
                    type: form.file.mimeType ?? "application/octet-stream",
                });
            }

            if (form.thumbnail) {
                const filename = form.thumbnail.uri.split("/").pop();
                const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
                data.append("thumbnail", {
                    uri: form.thumbnail.uri,
                    name: filename,
                    type: ext === "png" ? "image/png" : "image/jpeg",
                });
            }

            if (editTarget) {
                await api.patch(endpoints["material-partial-update"](editTarget.id), data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                Alert.alert("Thành công", "Đã cập nhật tài liệu.");
            } else {
                await api.post(endpoints["material-create"](), data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                Alert.alert("Thành công", "Tài liệu mới đã được tạo.");
            }

            closeModal();
            fetchMaterials(searchQuery);
        } catch (ex) {
            console.error("Save material error:", ex?.response?.data ?? ex.message);
            Alert.alert("Lỗi", "Không thể lưu tài liệu. Kiểm tra lại dữ liệu gửi lên.");
        } finally {
            setSaving(false);
        }
    };


    const handleDelete = (item) => {
        Alert.alert(
            "Xóa tài liệu",
            `Bạn có chắc muốn xóa "${item.title}"?`,
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa", style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem("token");
                            await authApis(token).delete(endpoints["material-delete"](item.id));
                            fetchMaterials(searchQuery);
                        } catch {
                            Alert.alert("Lỗi", "Không thể xóa tài liệu này.");
                        }
                    },
                },
            ]
        );
    };


    const renderItem = ({ item, index }) => {
        const type = getTypeInfo(item.material_type);
        const diff = getDiffInfo(item.difficulty);
        const hasTags = item.tags && item.tags.length > 0;

        return (
            <View style={styles.card}>
                {/* Order badge */}
                <View style={styles.orderBadge}>
                    <Text style={styles.orderText}>{item.order_index ?? index + 1}</Text>
                </View>

                {/* Thumbnail hoặc icon loại */}
                <View style={styles.typeIcon}>
                    {item.thumbnail ? (
                        <Image source={{ uri: item.thumbnail }} style={styles.thumbnailImg} />
                    ) : (
                        <Icon source={type.icon} size={26} color="#4f46e5" />
                    )}
                </View>

                {/* Info */}
                <View style={styles.cardBody}>
                    <Text style={styles.materialTitle} numberOfLines={2}>
                        {item.title}
                    </Text>

                    {/* FIX: bỏ height cứng, dùng alignItems thay thế */}
                    <View style={styles.chipRow}>
                        <Chip
                            style={[styles.chip, { backgroundColor: diff.bg }]}
                            textStyle={{ color: diff.color, fontSize: 10, fontWeight: "700", lineHeight: 14 }}
                            compact
                        >
                            {diff.label}
                        </Chip>
                        <Chip
                            style={[styles.chip, { backgroundColor: "#ede9fe" }]}
                            textStyle={{ color: "#4f46e5", fontSize: 10, fontWeight: "700", lineHeight: 14 }}
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

                    {hasTags && (
                        <View style={[styles.chipRow, { marginTop: 4 }]}>
                            {item.tags?.filter(tag => tag)?.map(tag => (
                                <Text key={tag.id} style={styles.tagText}>#{tag?.name}</Text>
                            ))}
                        </View>
                    )}
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

                        <TextInput
                            label="Tiêu đề *"
                            value={form.title}
                            onChangeText={(v) => setForm((prev) => ({ ...prev, title: v }))}
                            mode="outlined"
                            style={styles.input}
                            outlineColor="#e2e8f0"
                            activeOutlineColor="#4f46e5"
                        />

                        <TextInput
                            label="Mô tả / Nội dung"
                            value={form.content}
                            onChangeText={(v) => setForm((prev) => ({ ...prev, content: v }))}
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                            style={[styles.input, { height: 80 }]}
                            outlineColor="#e2e8f0"
                            activeOutlineColor="#4f46e5"
                        />

                        <Text style={styles.fieldLabel}>Định dạng *</Text>
                        <View style={styles.segmentRow}>
                            {MATERIAL_TYPES.map((t) => (
                                <TouchableOpacity
                                    key={t.value}
                                    style={[styles.segment, form.material_type === t.value && styles.segmentActive]}
                                    onPress={() => setForm((prev) => ({ ...prev, material_type: t.value }))}
                                >
                                    <Icon source={t.icon} size={16} color={form.material_type === t.value ? "#fff" : "#64748b"} />
                                    <Text style={[styles.segmentText, form.material_type === t.value && styles.segmentTextActive]}>
                                        {t.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.fieldLabel}>Mức độ</Text>
                        <View style={styles.segmentRow}>
                            {DIFFICULTIES.map((d) => (
                                <TouchableOpacity
                                    key={d.value}
                                    style={[styles.segment, form.difficulty === d.value && { backgroundColor: d.color, borderColor: d.color }]}
                                    onPress={() => setForm((prev) => ({ ...prev, difficulty: d.value }))}
                                >
                                    <Text style={[styles.segmentText, form.difficulty === d.value && styles.segmentTextActive]}>
                                        {d.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.row2}>
                            <TextInput
                                label="Thời lượng (Phút)"
                                value={form.duration_minutes}
                                onChangeText={(v) => setForm((prev) => ({ ...prev, duration_minutes: v }))}
                                keyboardType="numeric"
                                mode="outlined"
                                style={[styles.input, { flex: 1 }]}
                                outlineColor="#e2e8f0"
                                activeOutlineColor="#4f46e5"
                            />
                            <TextInput
                                label="Thứ tự hiển thị"
                                value={form.order_index}
                                onChangeText={(v) => setForm((prev) => ({ ...prev, order_index: v }))}
                                keyboardType="numeric"
                                mode="outlined"
                                style={[styles.input, { flex: 1 }]}
                                outlineColor="#e2e8f0"
                                activeOutlineColor="#4f46e5"
                            />
                        </View>

                        {/* Thumbnail Picker */}
                        <Text style={styles.fieldLabel}>Ảnh bìa (Tùy chọn)</Text>
                        <TouchableOpacity style={styles.thumbPicker} onPress={pickThumbnail} activeOpacity={0.8}>
                            {form.thumbnail || form.existingThumb ? (
                                <Image
                                    source={{ uri: form.thumbnail?.uri || form.existingThumb }}
                                    style={styles.thumbPreview}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.thumbEmpty}>
                                    <Icon source="image-plus" size={28} color="#a5b4fc" />
                                    <Text style={styles.thumbHint}>Chọn ảnh bìa (16:9)</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* File Picker */}
                        <Text style={styles.fieldLabel}>File tài liệu *</Text>
                        <TouchableOpacity style={styles.filePicker} onPress={pickFile}>
                            <Icon
                                source={form.file ? "check-circle" : "upload"}
                                size={20}
                                color={form.file ? "#16a34a" : "#4f46e5"}
                            />
                            <Text style={[styles.filePickerText, form.file && { color: "#16a34a" }]} numberOfLines={1}>
                                {form.file
                                    ? `✔ ${form.file.name}`
                                    : editTarget
                                        ? "Chọn file mới để thay thế"
                                        : "Tải file tài liệu lên *"}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.modalBtns}>
                            <Button mode="outlined" onPress={closeModal} style={styles.btnCancel} textColor="#64748b">
                                Hủy bỏ
                            </Button>
                            <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving} style={styles.btnSave} buttonColor="#4f46e5">
                                {editTarget ? "Cập nhật" : "Tạo mới"}
                            </Button>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>
        </Portal>
    );


    return (
        <View style={styles.screen}>
            <Header
                title="Quản lý tài liệu"
                subtitle={courseTitle ?? "Lớp học"}
                showBack
            />

            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Tìm kiếm tài liệu..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearchSubmit}
                    onClearIconPress={handleClearSearch}
                    style={styles.searchbar}
                    inputStyle={{ fontSize: 14 }}
                    iconColor="#4f46e5"
                    elevation={1}
                />
            </View>

            {loading || isSearching ? (
                <Loading text="Đang tải danh sách..." />
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

            <TouchableOpacity style={styles.fab} onPress={openCreate}>
                <Icon source="plus" size={28} color="#fff" />
            </TouchableOpacity>

            {renderModal()}
        </View>
    );
};


const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f8fafc" },
    list:   { padding: 16, paddingBottom: 100 },
    hint:   { fontSize: 13, color: "#94a3b8", marginBottom: 12, fontWeight: "500" },

    searchContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
    searchbar: { backgroundColor: "#fff", borderRadius: 12, height: 46 },


    card: {
        flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
        borderRadius: 14, marginBottom: 10, padding: 12, gap: 10,
        elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4,
    },
    orderBadge: {
        width: 28, height: 28, borderRadius: 8, backgroundColor: "#f1f5f9",
        justifyContent: "center", alignItems: "center",
    },
    orderText: { fontSize: 12, fontWeight: "700", color: "#64748b" },
    typeIcon: {
        width: 50, height: 50, borderRadius: 12, backgroundColor: "#ede9fe",
        justifyContent: "center", alignItems: "center", overflow: "hidden",
    },
    thumbnailImg: { width: "100%", height: "100%" },

    cardBody:      { flex: 1, gap: 6 },
    materialTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a", lineHeight: 20 },


    chipRow:      { flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center" },
    chip:         { borderRadius: 6 },
    durationRow:  { flexDirection: "row", alignItems: "center", gap: 3 },
    durationText: { fontSize: 11, color: "#94a3b8" },
    tagText:      { fontSize: 10, color: "#4f46e5", fontWeight: "600", backgroundColor: "#e0e7ff", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

    actions:   { flexDirection: "column", gap: 6 },
    editBtn:   { width: 32, height: 32, borderRadius: 8, backgroundColor: "#ede9fe", justifyContent: "center", alignItems: "center" },
    deleteBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#fee2e2", justifyContent: "center", alignItems: "center" },

    fab: {
        position: "absolute", bottom: 24, right: 24,
        width: 56, height: 56, borderRadius: 28, backgroundColor: "#4f46e5",
        justifyContent: "center", alignItems: "center", elevation: 6,
        shadowColor: "#4f46e5", shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35, shadowRadius: 8,
    },

    empty:        { alignItems: "center", marginTop: 80, gap: 10 },
    emptyText:    { fontSize: 16, color: "#94a3b8", fontWeight: "600" },
    emptySubText: { fontSize: 13, color: "#cbd5e1" },

    modal: { margin: 16, backgroundColor: "#fff", borderRadius: 20, padding: 20, maxHeight: "90%" },
    modalTitle:  { fontSize: 17, fontWeight: "800", color: "#0f172a", marginBottom: 12 },
    fieldLabel:  { fontSize: 13, fontWeight: "600", color: "#475569", marginTop: 12, marginBottom: 6 },
    input:       { backgroundColor: "#fff", marginBottom: 8 },
    row2:        { flexDirection: "row", gap: 10 },

    segmentRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
    segment: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" },
    segmentActive:     { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
    segmentText:       { fontSize: 12, fontWeight: "600", color: "#64748b" },
    segmentTextActive: { color: "#fff" },

    thumbPicker:  { width: "100%", height: 100, borderRadius: 12, overflow: "hidden", backgroundColor: "#f5f3ff", borderWidth: 1.5, borderColor: "#ddd6fe", borderStyle: "dashed", justifyContent: "center", alignItems: "center", marginBottom: 8 },
    thumbPreview: { width: "100%", height: "100%" },
    thumbEmpty:   { alignItems: "center", justifyContent: "center" },
    thumbHint:    { fontSize: 12, color: "#4f46e5", fontWeight: "600", marginTop: 4 },

    filePicker:     { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1.5, borderColor: "#4f46e5", borderStyle: "dashed", borderRadius: 12, padding: 14, marginTop: 4, backgroundColor: "#fafafa" },
    filePickerText: { fontSize: 13, color: "#4f46e5", fontWeight: "600", flex: 1 },

    modalBtns:  { flexDirection: "row", gap: 10, marginTop: 24 },
    btnCancel:  { flex: 1, borderColor: "#e2e8f0" },
    btnSave:    { flex: 1 },
});

export default ManageMaterialScreen;
