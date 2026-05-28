import React, { useState, useEffect, useCallback } from "react";
import { ScrollView, View, StyleSheet, Image, useWindowDimensions ,Alert} from "react-native";
import { Text, Card, Chip, Button, Divider, ProgressBar, Icon } from "react-native-paper";
import RenderHTML from "react-native-render-html";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import { authApis, endpoints } from "../../configs/Apis";
import { Header, Loading } from "../../components/common"; 

const MaterialDetailScreen = ({ route, navigation }) => {
    const { materialId } = route.params;
    const { width } = useWindowDimensions();

    const [material, setMaterial] = useState(null);
    const [progress, setProgress] = useState(null); // State lưu tiến độ học tập
    const [loading, setLoading] = useState(true);


    const loadData = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            

            const resMat = await authApis(token).get(endpoints["material-detail"](materialId));
            setMaterial(resMat.data);
            try {
              const resProg = await authApis(token).get(
    endpoints["material-progress"](materialId)
);
                if (resProg.data && resProg.data.length > 0) {
                    setProgress(resProg.data[0]);
                }
            } catch (progErr) {
               console.log(
        "GET PROGRESS ERROR:",
        progErr?.response?.data || progErr.message
    );
            }

        } catch (ex) {
            console.error("Lỗi tải chi tiết bài học:", ex);
        } finally {
            setLoading(false);
        }
    };


    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [materialId])
    );

    const handleOpenMaterial = () => {
        if (!material?.file) {
            alert("Tài liệu này chưa có file đính kèm!");
            return; 
        }
        
        const { material_type, file, title } = material;

        const lastPosition = progress?.last_position_sec || 0; 

        if (material_type === 'video') {
           navigation.navigate("VideoPlayer", { 
    videoUrl: file,
    materialId: material.id,
    title: title,
    startAt: lastPosition
});
        } else if (['pdf', 'slide'].includes(material_type)) {
    navigation.navigate("DocumentViewer", {
        fileUrl: file,
        title: title,
        materialId: material.id,
        initialProgress: progress ?? { watched_minutes: 0, progress_percent: 0 },

        });
        } else {
            alert("Định dạng file không được hỗ trợ.");
        }
    };

    const getStatusText = (status) => {
        const statuses = {
            'not_started': 'Chưa học',
            'in_progress': 'Đang học',
            'completed': 'Đã hoàn thành'
        };
        return statuses[status] || 'Chưa học';
    };

    const getDifficultyColor = (diff) => {
        if (diff === 'easy') return { bg: '#dcfce7', text: '#16a34a' };
        if (diff === 'medium') return { bg: '#fef9c3', text: '#ca8a04' };
        if (diff === 'hard') return { bg: '#fee2e2', text: '#dc2626' };
        return { bg: '#f1f5f9', text: '#475569' };
    };

    if (loading) return <Loading text="Đang tải dữ liệu bài học..." />;

    if (!material) {
        return (
            <View style={styles.center}>
                <Icon source="file-hidden" size={48} color="#cbd5e1" />
                <Text style={{ marginTop: 12, color: "#64748b" }}>Không tìm thấy bài học.</Text>
            </View>
        );
    }

    const diffStyle = getDifficultyColor(material.difficulty);
    const currentProgress = progress?.progress_percent || 0;

    return (
        <View style={styles.screen}>
            <Header title={material.course?.title || "Chi tiết bài học"} showBack />
            
            <ScrollView showsVerticalScrollIndicator={false}>
                {material.thumbnail ? (
                    <Image source={{ uri: material.thumbnail }} style={styles.coverImage} />
                ) : (
                    <View style={[styles.coverImage, styles.placeholderImage]}>
                        <Icon source="image-outline" size={40} color="#94a3b8" />
                    </View>
                )}

                <View style={styles.contentPadding}>
                    <Text variant="headlineSmall" style={styles.title}>
                        {material.title}
                    </Text>

                    {/* Tags & Meta Info */}
                    <View style={styles.badgeRow}>
                        <Chip icon="shape-outline" style={styles.chip}>
                            {material.material_type?.toUpperCase()}
                        </Chip>

                        <Chip 
                            icon="signal-cellular-2" 
                            style={[styles.chip, { backgroundColor: diffStyle.bg }]}
                            textStyle={{ color: diffStyle.text, fontWeight: 'bold' }}
                        >
                            {material.difficulty === 'easy' ? 'Dễ' : material.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                        </Chip>
                        {material.duration_minutes > 0 && (
                            <Chip icon="clock-outline" style={styles.chip}>
                                {material.duration_minutes} phút
                            </Chip>
                        )}
                    </View>

                    {/* Progress Card */}
                    <Card style={styles.progressCard} mode="outlined">
                        <Card.Content>
                            <View style={styles.rowBetween}>
                                <Text variant="titleMedium" style={{ fontWeight: "bold", color: "#1e293b" }}>
                                    Tiến độ của bạn
                                </Text>
                                <Text style={{ color: currentProgress === 100 ? "#16a34a" : "#4f46e5", fontWeight: "bold" }}>
                                    {Math.round(currentProgress)}%
                                </Text>
                            </View>

                            <ProgressBar 
                                progress={currentProgress / 100} 
                                color={currentProgress === 100 ? "#16a34a" : "#4f46e5"} 
                                style={styles.progressBar} 
                            />

                            <View style={styles.rowBetween}>
                                <Text variant="bodySmall" style={{ color: "#64748b", fontWeight: '500' }}>
                                    Trạng thái: {getStatusText(progress?.status)}
                                </Text>
                                {progress?.watched_minutes > 0 && (
                                    <Text variant="bodySmall" style={{ color: "#64748b" }}>
                                        Đã xem: {progress.watched_minutes} phút
                                    </Text>
                                )}
                            </View>
                        </Card.Content>
                    </Card>

                    {/* Action Button */}
                    <Button 
                        mode="contained" 
                        icon={material.material_type === "video" ? "play-circle" : "file-document-outline"} 
                        style={[styles.mainActionBtn, { backgroundColor: currentProgress === 100 ? "#16a34a" : "#4f46e5" }]}
                        contentStyle={{ height: 52 }}
                        labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
                        onPress={handleOpenMaterial}
                    >
                        {material.material_type === "video" 
                            ? (progress?.last_position_sec > 0 ? "Tiếp tục xem" : "Xem Video") 
                            : "Mở tài liệu"}
                    </Button>

                    <Divider style={styles.divider} />

                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Nội dung bài học
                    </Text>

                    <RenderHTML
                        contentWidth={width - 40}
                        source={{ html: material.content || "<p style='color: #94a3b8;'>Chưa có mô tả chi tiết.</p>" }}
                        tagsStyles={{
                            body: { color: "#334155", fontSize: 15, lineHeight: 24 },
                            p: { marginBottom: 12 },
                            strong: { fontWeight: "bold", color: "#0f172a" },
                            h1: { fontSize: 20, fontWeight: "bold", color: "#0f172a", marginTop: 8 },
                            h2: { fontSize: 18, fontWeight: "bold", color: "#0f172a", marginTop: 8 }
                        }}
                    />

                    {/* Hiển thị Tags khóa học nếu có */}
                    {material.tags && material.tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                            {material.tags.filter(tag => tag).map(tag => (
                                <View key={tag.id} style={styles.smallTag}>
                                    <Text style={styles.smallTagText}>#{tag?.name}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <Divider style={styles.divider} />

                    {/* Interaction Buttons */}
                    <View style={styles.interactionRow}>
                        <Button
                            mode="outlined"
                            icon="pencil-outline"
                            style={styles.subBtn}
                            textColor="#4f46e5"
                            onPress={() => navigation.navigate("Note", { materialId: material.id })}
                        >
                            Ghi chú
                        </Button>

                        <Button
                            mode="outlined"
                            icon="forum-outline"
                            style={styles.subBtn}
                            textColor="#4f46e5"
                            onPress={() => navigation.navigate("Comment", { materialId: material.id })}
                        >
                            Thảo luận
                        </Button>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#ffffff" },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" },
    coverImage: { width: "100%", height: 220, resizeMode: "cover" },
    placeholderImage: { backgroundColor: "#e2e8f0", justifyContent: "center", alignItems: "center" },
    contentPadding: { padding: 20 },
    title: { fontWeight: "bold", color: "#0f172a", marginBottom: 16, lineHeight: 32 },
    badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
    chip: { backgroundColor: "#f1f5f9", borderRadius: 8 },
    progressCard: { backgroundColor: "#ffffff", borderColor: "#e2e8f0", marginBottom: 24, borderRadius: 12 },
    rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    progressBar: { height: 8, borderRadius: 4, backgroundColor: "#e2e8f0" },
    mainActionBtn: { borderRadius: 12, marginBottom: 24, elevation: 2 },
    divider: { marginVertical: 24, backgroundColor: "#e2e8f0" },
    sectionTitle: { fontWeight: "bold", color: "#1e293b", marginBottom: 12 },
    tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
    smallTag: { backgroundColor: "#f1f5f9", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
    smallTagText: { fontSize: 12, color: "#64748b", fontWeight: "600" },
    interactionRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingBottom: 40 },
    subBtn: { flex: 1, borderRadius: 12, borderColor: "#cbd5e1", borderWidth: 1 }
});

export default MaterialDetailScreen;
