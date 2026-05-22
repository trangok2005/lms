import React, { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Avatar, Icon } from "react-native-paper";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { authApis, endpoints } from "../../configs/Apis";
import InteractionScreen from "../../screens/Materials/InteractionScreen";
import { formatRelativeTime } from "../../configs/dateUtils";

const CommentScreen = () => {
    const route = useRoute();
    const { materialId } = route.params;

    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");

    const fetchComments = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(endpoints["comments"], {
                params: { material: materialId }
            });
            setComments(res.data);
        } catch (ex) {
            console.error("Fetch comments error:", ex);
        } finally {
            setLoading(false);
        }
    };

    const handleSendComment = async () => {
        if (!newComment.trim()) return;
        try {
            const token = await AsyncStorage.getItem("token");
            await authApis(token).post(endpoints["comments"], {
                content: newComment,
                material: materialId 
            });
            setNewComment("");
            fetchComments();
        } catch (ex) {
            console.error("Post comment error:", ex);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (materialId) fetchComments();
        }, [materialId])
    );

    /**
     * Safely renders the user's avatar or a fallback initial
     */
    const renderAvatar = (user) => {
        if (user?.avatar) {
            return <Avatar.Image size={40} source={{ uri: user.avatar }} style={styles.avatar} />;
        }
        
        // Fallback: Use the first letter of the username
        const initial = user?.username ? user.username.charAt(0).toUpperCase() : "?";
        return (
            <Avatar.Text 
                size={40} 
                label={initial} 
                style={[styles.avatar, { backgroundColor: "#c7d2fe" }]} 
                color="#4f46e5" 
            />
        );
    };

    return (
        <InteractionScreen
            title="Discussion"
            data={comments}
            loading={loading}
            placeholder="Share your thoughts..."
            input={newComment}
            setInput={setNewComment}
            onSend={handleSendComment}
            renderItem={({ item }) => (
                <View style={styles.commentRow}>
                    {renderAvatar(item.user)}
                    <View style={styles.bubbleWrapper}>
                        <View style={styles.commentBubble}>
                            <Text style={styles.userName}>
                                {item.user?.username || "Anonymous"}
                            </Text>
                            <Text style={styles.commentText}>{item.content}</Text>
                        </View>
                        <Text style={styles.timeText}>
                            {formatRelativeTime(item.created_date)}
                        </Text>
                    </View>
                </View>
            )}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Icon source="forum-outline" size={50} color="#cbd5e1" />
                    <Text style={styles.emptyText}>No discussions yet. Be the first!</Text>
                </View>
            }
        />
    );
};

const styles = StyleSheet.create({
    commentRow: { 
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
    commentBubble: { 
        backgroundColor: "#ffffff", 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        borderRadius: 18,
        borderTopLeftRadius: 4, // Creates the distinct chat-bubble tail
        elevation: 1, // Subtle shadow for depth
    },
    userName: { 
        fontWeight: "700", 
        color: "#4f46e5", 
        marginBottom: 4,
        fontSize: 13, 
    },
    commentText: { 
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

export default CommentScreen;
