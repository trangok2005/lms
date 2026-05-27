import React, { useState, useEffect } from "react";
import {
    View, StyleSheet, ScrollView, TouchableOpacity,
    Image, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import {
    Text, Icon, ActivityIndicator, TextInput,
    SegmentedButtons, HelperText,
} from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { authApis, endpoints } from "../../configs/Apis";

// Lưu ý: Backend dùng ForeignKey cho Category, nên dữ liệu gửi lên phải là ID (số nguyên)
// Bạn nên fetch danh sách này từ CategoryViewSet thay vì hardcode. Dưới đây là giá trị ID giả định:
const CATEGORIES = [
    { value: 1, label: "Lập trình" },
    { value: 2, label: "Thiết kế" },
    { value: 3, label: "Kinh doanh" },
    { value: 4, label: "Marketing" },
    { value: 5, label: "Ngoại ngữ" },
    { value: 6, label: "Khác" },
];

const LEVELS = [
    { value: "beginner",     label: "Cơ bản" },
    { value: "intermediate", label: "Trung cấp" },
    { value: "advanced",     label: "Nâng cao" },
];

// Cập nhật cấu trúc ban đầu: dùng "subject" thay vì "title"
const INIT_FORM = {
    subject: "", description: "", price: "",
    category: "", level: "beginner", status: "draft",
    image: null, 
};

const CourseFormScreen = () => {
    const navigation = useNavigation();
    const route      = useRoute();
    const editCourse = route.params?.course ?? null; 
    const isEdit     = !!editCourse;

    const [form,    setForm]    = useState(INIT_FORM);
    const [errors,  setErrors]  = useState({});
    const [saving,  setSaving]  = useState(false);
    const [imgNew,  setImgNew]  = useState(false); 

    useEffect(() => {
        if (isEdit) {
            setForm({
                subject:     editCourse.subject ?? "",
                description: editCourse.description ?? "",
                price:       String(editCourse.price ?? "0"),
                category:    editCourse.category?.id ?? editCourse.category ?? "", // Lấy ID của category
                level:       editCourse.level ?? "beginner",
                status:      editCourse.status ?? "draft",
                image:       editCourse.image ?? null,
            });
        }
    }, []);

    const set = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    // ── Image picker ──────────────────────────────────────
    const pickImage = async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            Alert.alert("Cần quyền truy cập", "Vui lòng cấp quyền thư viện ảnh.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: [16, 9], quality: 0.8,
        });
        if (!result.canceled) {
            set("image", result.assets[0].uri);
            setImgNew(true);
        }
    };

    // ── Validate ──────────────────────────────────────────
    const validate = () => {
        const e = {};
        if (!form.subject.trim())     e.subject = "Tiêu đề không được để trống";
        if (!form.description.trim()) e.description = "Mô tả không được để trống";
        if (!form.category)           e.category = "Vui lòng chọn danh mục";
        const p = Number(form.price);
        if (isNaN(p) || p < 0)        e.price = "Giá không hợp lệ";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Submit ────────────────────────────────────────────
    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const token    = await AsyncStorage.getItem("token");
            const formData = new FormData();
            
            // Map sang đúng tham số Backend yêu cầu (subject)
            formData.append("subject",     form.subject.trim());
            formData.append("description", form.description.trim());
            formData.append("price",       form.price || "0");
            formData.append("category",    form.category); // Đảm bảo đây là category ID
            formData.append("level",       form.level);
            formData.append("status",      form.status);

            if (imgNew && form.image) {
                const filename  = form.image.split("/").pop();
                const extension = filename.split(".").pop()?.toLowerCase() ?? "jpg";
                const mimeType  = extension === "png" ? "image/png" : "image/jpeg";
                formData.append("image", { uri: form.image, name: filename, type: mimeType });
            }

            if (isEdit) {
                await authApis(token).patch(
                    endpoints["course-detail"](editCourse.id),
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );
            } else {
                await authApis(token).post(
                    endpoints["courses"],
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );
            }
            Alert.alert(
                "Thành công",
                isEdit ? "Cập nhật khóa học thành công!" : "Tạo khóa học thành công!",
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        } catch (e) {
            const msg = e?.response?.data
                ? JSON.stringify(e.response.data)
                : e.message;
            Alert.alert("Lỗi", `Không thể lưu khóa học.\n${msg}`);
        } finally {
            setSaving(false);
        }
    };

    // ── Field component ───────────────────────────────────
    const Field = ({ label, field, multiline, keyboardType, placeholder }) => (
        <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
                value={form[field]}
                onChangeText={v => set(field, v)}
                placeholder={placeholder}
                mode="outlined"
                outlineStyle={styles.inputOutline}
                style={[styles.input, multiline && styles.inputMulti]}
                multiline={multiline}
                numberOfLines={multiline ? 5 : 1}
                keyboardType={keyboardType ?? "default"}
                error={!!errors[field]}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4f46e5"
            />
            {errors[field] && <HelperText type="error">{errors[field]}</HelperText>}
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={styles.screen}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Icon source="arrow-left" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {isEdit ? "Chỉnh sửa khóa học" : "Tạo khóa học mới"}
                    </Text>
                    {saving
                        ? <ActivityIndicator color="#fff" size="small" />
                        : (
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                <Text style={styles.saveBtnTxt}>Lưu</Text>
                            </TouchableOpacity>
                        )
                    }
                </View>

                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Thumbnail picker */}
                    <Text style={styles.sectionLabel}>Ảnh bìa</Text>
                    <TouchableOpacity style={styles.thumbPicker} onPress={pickImage} activeOpacity={0.8}>
                        {form.image
                            ? <Image source={{ uri: form.image }} style={styles.thumbPreview} resizeMode="cover" />
                            : (
                                <View style={styles.thumbEmpty}>
                                    <View style={styles.thumbIconWrap}>
                                        <Icon source="camera-plus-outline" size={32} color="#a5b4fc" />
                                    </View>
                                    <Text style={styles.thumbHint}>Nhấn để chọn ảnh bìa</Text>
                                    <Text style={styles.thumbHintSub}>Khuyến nghị tỉ lệ 16:9</Text>
                                </View>
                            )
                        }
                        <View style={styles.thumbOverlay}>
                            <Icon source="pencil" size={16} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    {/* Title & Description */}
                    <Field label="Tiêu đề khóa học *" field="subject"
                        placeholder="Nhập tiêu đề khóa học..." />
                    <Field label="Mô tả *" field="description"
                        placeholder="Giới thiệu chi tiết về khóa học..." multiline />

                    {/* Price */}
                    <Field label="Học phí (₫)" field="price"
                        placeholder="0 = Miễn phí" keyboardType="numeric" />

                    {/* Category */}
                    <Text style={styles.sectionLabel}>Danh mục</Text>
                    <View style={styles.optionGrid}>
                        {CATEGORIES.map(c => (
                            <TouchableOpacity
                                key={c.value}
                                style={[styles.optionChip, form.category === c.value && styles.optionChipActive]}
                                onPress={() => set("category", c.value)}
                            >
                                <Text style={[styles.optionTxt, form.category === c.value && styles.optionTxtActive]}>
                                    {c.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {errors.category && <HelperText type="error" style={{marginTop: -16, marginBottom: 10}}>{errors.category}</HelperText>}

                    {/* Level */}
                    <Text style={styles.sectionLabel}>Cấp độ</Text>
                    <SegmentedButtons
                        value={form.level}
                        onValueChange={v => set("level", v)}
                        buttons={LEVELS.map(l => ({ value: l.value, label: l.label }))}
                        style={styles.segmented}
                    />

                    {/* Status */}
                    <Text style={styles.sectionLabel}>Trạng thái</Text>
                    <SegmentedButtons
                        value={form.status}
                        onValueChange={v => set("status", v)}
                        buttons={[
                            { value: "draft",     label: "Nháp" },
                            { value: "published", label: "Xuất bản" },
                            { value: "archived",  label: "Lưu trữ" },
                        ]}
                        style={styles.segmented}
                    />

                    {/* Save button (bottom) */}
                    <TouchableOpacity
                        style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Icon source={isEdit ? "content-save" : "plus-circle"} size={20} color="#fff" />
                        }
                        <Text style={styles.submitBtnTxt}>
                            {saving ? "Đang lưu..." : isEdit ? "Cập nhật khóa học" : "Tạo khóa học"}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
};

export default CourseFormScreen;

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f8fafc" },

    header: {
        backgroundColor: "#4f46e5",
        paddingTop: 52, paddingBottom: 18, paddingHorizontal: 16,
        flexDirection: "row", alignItems: "center", gap: 12,
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
        elevation: 6,
        shadowColor: "#4f46e5", shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25, shadowRadius: 10,
    },
    backBtn:     { padding: 4 },
    headerTitle: { flex: 1, color: "#fff", fontSize: 18, fontWeight: "800" },
    saveBtn:     {
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 14, paddingVertical: 7,
        borderRadius: 10,
    },
    saveBtnTxt:  { color: "#fff", fontWeight: "700", fontSize: 13 },

    scroll: { padding: 20, paddingBottom: 48 },

    sectionLabel: {
        fontSize: 13, fontWeight: "700", color: "#475569",
        marginBottom: 10, marginTop: 8, textTransform: "uppercase", letterSpacing: 0.5,
    },

    // Thumbnail
    thumbPicker: {
        width: "100%", height: 180, borderRadius: 16,
        overflow: "hidden", marginBottom: 20,
        backgroundColor: "#f5f3ff",
        borderWidth: 1.5, borderColor: "#ddd6fe", borderStyle: "dashed",
        position: "relative",
    },
    thumbPreview:  { width: "100%", height: "100%" },
    thumbEmpty:    { flex: 1, justifyContent: "center", alignItems: "center", gap: 6 },
    thumbIconWrap: {
        width: 64, height: 64, borderRadius: 18,
        backgroundColor: "#ede9fe",
        justifyContent: "center", alignItems: "center", marginBottom: 4,
    },
    thumbHint:    { fontSize: 14, fontWeight: "700", color: "#4f46e5" },
    thumbHintSub: { fontSize: 12, color: "#94a3b8" },
    thumbOverlay: {
        position: "absolute", right: 10, bottom: 10,
        width: 30, height: 30, borderRadius: 8,
        backgroundColor: "rgba(79,70,229,0.85)",
        justifyContent: "center", alignItems: "center",
    },

    // Text input
    fieldWrap:    { marginBottom: 16 },
    fieldLabel:   { fontSize: 13, fontWeight: "700", color: "#475569", marginBottom: 6 },
    input:        { backgroundColor: "#fff", fontSize: 14 },
    inputMulti:   { height: 120 },
    inputOutline: { borderRadius: 12 },

    // Category chips
    optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
    optionChip: {
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 20, borderWidth: 1.5, borderColor: "#e2e8f0",
        backgroundColor: "#fff",
    },
    optionChipActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
    optionTxt:        { fontSize: 13, color: "#475569", fontWeight: "600" },
    optionTxtActive:  { color: "#fff" },

    // Segmented
    segmented: { marginBottom: 20 },

    // Submit
    submitBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 10, backgroundColor: "#4f46e5", borderRadius: 16,
        paddingVertical: 16, marginTop: 8,
        elevation: 4, shadowColor: "#4f46e5", shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8,
    },
    submitBtnDisabled: { backgroundColor: "#a5b4fc" },
    submitBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
