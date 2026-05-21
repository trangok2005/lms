import React, { useState, useEffect } from "react";
import { ScrollView, View, StyleSheet, Image } from "react-native";
import { Text, Card, Chip, Button, Divider, ProgressBar, ActivityIndicator } from "react-native-paper";
import { authApis, endpoints } from "../../configs/Apis";
import { Header } from "../../components/common";

const MaterialDetailScreen = ({ route, navigation }) => {
    const { materialId } = route.params;
    const [material, setMaterial] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMaterial = async () => {
            try {
                const res = await authApis().get(endpoints["material-detail"](materialId));
                setMaterial(res.data);
            } catch (ex) {
                console.error("Lỗi:", ex);
            } finally {
                setLoading(false);
            }
        };
        loadMaterial();
    }, [materialId]);

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    if (!material) return <View style={styles.center}><Text>Không tìm thấy bài học.</Text></View>;

    return (
        <View style={styles.screen}>
            <Header title="Chi tiết bài học" showBack />
            
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Ảnh Bìa Bắt Mắt */}
                {material.thumbnail ? (
                    <Image source={{ uri: material.thumbnail.url || material.thumbnail }} style={styles.coverImage} />
                ) : (
                    <View style={[styles.coverImage, { backgroundColor: "#cbd5e1" }]} />
                )}

                <View style={styles.contentPadding}>
                    {/* Tiêu đề & Tags */}
                    <Text variant="headlineSmall" style={styles.title}>{material.title}</Text>
                    <View style={styles.badgeRow}>
                        <Chip icon="tag" style={styles.chip}>{material.material_type.toUpperCase()}</Chip>
                        <Chip icon="signal" style={styles.chip}>{material.difficulty.toUpperCase()}</Chip>
                        {material.duration_minutes > 0 && (
                            <Chip icon="clock-outline" style={styles.chip}>{material.duration_minutes} phút</Chip>
                        )}
                    </View>

                    {/* Tiến độ học tập (Giả lập theo Model MaterialProgress) */}
                    <Card style={styles.progressCard} mode="outlined">
                        <Card.Content>
                            <View style={styles.rowBetween}>
                                <Text variant="titleMedium" style={{ fontWeight: "bold" }}>Tiến trình của bạn</Text>
                                <Text style={{ color: "#3b82f6", fontWeight: "bold" }}>0%</Text> 
                            </View>
                            <ProgressBar progress={0} color="#3b82f6" style={styles.progressBar} />
                            <Text variant="bodySmall" style={{ color: "#64748b" }}>Trạng thái: Chưa học</Text>
                        </Card.Content>
                    </Card>

                    {/* Nút Hành Động Trực Quan */}
                    <Button 
                        mode="contained" 
                        icon={material.material_type === 'video' ? "play" : "file-document"} 
                        style={styles.mainActionBtn}
                        contentStyle={{ height: 50 }}
                        onPress={() => alert("Tính năng mở file đang phát triển!")}
                    >
                        {material.material_type === 'video' ? "Phát Video Ngay" : "Mở Tài Liệu"}
                    </Button>

                    <Divider style={styles.divider} />

                    {/* Nội dung mô tả (Content) */}
                    <Text variant="titleMedium" style={styles.sectionTitle}>Nội dung bài học</Text>
                    <Text variant="bodyMedium" style={styles.bodyText}>
                        {/* Lưu ý: Nếu content chứa thẻ HTML, nó sẽ hiện text thô. 
                            Nếu muốn render HTML chuẩn sau này có thể dùng Webview hoặc React Native Render HTML */}
                        {material.content || "Bài học này hiện chưa có nội dung mô tả chi tiết."}
                    </Text>

                    <Divider style={styles.divider} />

                    {/* Tương tác (Models: Interaction, Comment, Note) */}
                    <View style={styles.interactionRow}>
                        <Button mode="outlined" icon="pencil" style={styles.subBtn} onPress={() => navigation.navigate("Note")}>
                            Ghi chú
                        </Button>
                        <Button mode="outlined" icon="comment-text-multiple" style={styles.subBtn} onPress={() => navigation.navigate("Comment")}>
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
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    coverImage: { width: "100%", height: 220, resizeMode: "cover" },
    contentPadding: { padding: 20 },
    title: { fontWeight: "bold", color: "#0f172a", marginBottom: 12 },
    badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
    chip: { backgroundColor: "#f1f5f9" },
    progressCard: { backgroundColor: "#f8fafc", borderColor: "#e2e8f0", marginBottom: 20 },
    rowBetween: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    progressBar: { height: 8, borderRadius: 4, marginBottom: 8, backgroundColor: "#e2e8f0" },
    mainActionBtn: { borderRadius: 12, backgroundColor: "#2563eb", marginBottom: 20 },
    divider: { marginVertical: 20 },
    sectionTitle: { fontWeight: "bold", color: "#334155", marginBottom: 10 },
    bodyText: { color: "#475569", lineHeight: 24 },
    interactionRow: { flexDirection: "row", justifyContent: "space-between", gap: 10, paddingBottom: 40 },
    subBtn: { flex: 1, borderRadius: 8, borderColor: "#cbd5e1" }
});

export default MaterialDetailScreen;
