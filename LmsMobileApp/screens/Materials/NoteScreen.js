import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Avatar, Icon } from "react-native-paper";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { authApis, endpoints } from "../../configs/Apis";
import { MaterialSession } from "../../configs/MaterialSession";
import InteractionScreen from "../../screens/Materials/InteractionScreen";
import { formatRelativeTime } from "../../configs/dateUtils";

const NoteScreen = () => {
    const route = useRoute();

    const [materialId, setMaterialId] = useState(route.params?.materialId);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newNote, setNewNote] = useState("");

    // Helper: Chuyển đổi giây thành định dạng MM:SS (ví dụ: 75s -> 01:15)
    const formatVideoTime = (seconds) => {
        if (seconds === null || seconds === undefined) return null;
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    // Khôi phục materialId nếu bị mất khi reload
    useEffect(() => {
        const restoreId = async () => {
            if (!materialId) {
                const savedId = await MaterialSession.getId();
                if (savedId) {
                    setMaterialId(savedId);
                } else {
                    setLoading(false); 
                }
            }
        };
        restoreId();
    }, []);

    useEffect(() => {
        if (materialId) fetchNotes();
    }, [materialId]);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            if (!token) return;

            const res = await authApis(token).get(endpoints["notes"], {
                params: { material: materialId }
            });
            setNotes(res.data);
        } catch (ex) {
            console.error("Fetch notes error:", ex);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) return;

            await authApis(token).post(endpoints["notes"], {
                content: newNote,
                material: materialId
            });

            setNewNote("");
            fetchNotes();
        } catch (ex) {
            console.error("Add note error:", ex);
        }
    };

    /**
     * Hàm hiển thị Avatar hoặc tên viết tắt (giống bên Comment)
     */
    const renderAvatar = (user) => {
        if (user?.avatar) {
            return <Avatar.Image size={40} source={{ uri: user.avatar }} style={styles.avatar} />;
        }
        const initial = user?.username ? user.username.charAt(0).toUpperCase() : "?";
        return (
            <Avatar.Text 
                size={40} 
                label={initial} 
                style={[styles.avatar, { backgroundColor: "#dbeafe" }]} 
                color="#2563eb" 
            />
        );
    };

    return (
        <InteractionScreen
            title="Ghi chú bài học"
            data={notes}
            loading={loading}
            placeholder="Nhập nội dung ghi chú..."
            input={newNote}
            setInput={setNewNote}
            onSend={handleAddNote}
            renderItem={({ item }) => (
                <View style={styles.noteRow}>
                    {renderAvatar(item.user)}
                    <View style={styles.bubbleWrapper}>
                        <View style={styles.noteBubble}>
                            <View style={styles.headerRow}>
                                <Text style={styles.userName}>
                                    {item.user?.username || "Học viên"}
                                </Text>
                                
                                {/* Hiển thị mốc thời gian video nếu có */}
                                {item.timestamp_sec !== null && (
                                    <View style={styles.timestampBadge}>
                                        <Icon source="timer-outline" size={12} color="#2563eb" />
                                        <Text style={styles.timestampText}>
                                            {formatVideoTime(item.timestamp_sec)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            
                            <Text style={styles.noteContent}>{item.content}</Text>
                        </View>
                        
                        <Text style={styles.timeText}>
                            {formatRelativeTime(item.created_date)}
                        </Text>
                    </View>
                </View>
            )}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Icon source="pencil-note-outline" size={50} color="#cbd5e1" />
                    <Text style={styles.emptyText}>Bạn chưa có ghi chú nào cho bài học này.</Text>
                </View>
            }
        />
    );
};

const styles = StyleSheet.create({
    noteRow: { 
        flexDirection: "row", 
        marginBottom: 20,
        alignItems: "flex-start",
    },
    avatar: { 
        marginRight: 12, 
        marginTop: 2,
    },
    bubbleWrapper: {
        flex: 1,
    },
    noteBubble: { 
        backgroundColor: "#ffffff", 
        paddingHorizontal: 14, 
        paddingVertical: 10, 
        borderRadius: 16,
        borderTopLeftRadius: 4, // Tạo cái đuôi bong bóng chat
        elevation: 1, // Bóng đổ nhẹ trên Android
        shadowColor: "#000", // Bóng đổ cho iOS
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: { 
        fontWeight: "700", 
        color: "#1e293b", 
        fontSize: 13, 
    },
    timestampBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    timestampText: {
        fontSize: 11,
        color: '#2563eb',
        fontWeight: 'bold',
        marginLeft: 2,
    },
    noteContent: { 
        color: "#334155", 
        fontSize: 15,
        lineHeight: 22,
    },
    timeText: { 
        marginTop: 6, 
        marginLeft: 4,
        color: "#94a3b8", 
        fontSize: 11, 
        fontWeight: "500"
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 80,
    },
    emptyText: { 
        marginTop: 12,
        fontSize: 15,
        color: "#94a3b8",
        textAlign: "center"
    }
});

export default NoteScreen;
