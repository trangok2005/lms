import React, { useCallback, useContext, useState, useRef ,useEffect} from "react";
import {
  View, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, TextInput as RNTextInput, TouchableOpacity, Alert
} from "react-native";
import { Text, Avatar, Divider, IconButton, ActivityIndicator } from "react-native-paper";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/MyContext";
import Styles, { colors } from "../../styles/Styles";
import { Header, Loading,  } from "../../components/common";
import { CommentSection, TopicItem } from "../../components/forum";

const ForumDetailScreen = () => {
  const nav          = useNavigation();
  const { params }   = useRoute();
  const [user]       = useContext(MyUserContext);

  const [topic,    setTopic]    = useState(params.topic ?? null);
  const [loading,  setLoading]  = useState(!params.topic);
  const [reply,    setReply]    = useState("");
  const [sending,  setSending]  = useState(false);
  const inputRef                = useRef(null);

  // ── Tải danh sách bình luận (Replies) ──────────────────────────
  useFocusEffect(
    useCallback(() => {
      const fetchReplies = async () => {
        try {
          setLoading(true);
          const token = await AsyncStorage.getItem("token");
          if (!token) {
            console.debug("ForumDetailScreen: missing auth token");
            setLoading(false);
            return;
          }

          const repliesRes = await authApis(token)
            .get(endpoints["forum-reply"](params.topicId))
            .catch(() => ({ data: [] }));

          const replies = repliesRes.data.results ?? repliesRes.data ?? [];
          setTopic((prev) => ({ ...(prev ?? {}), replies }));
        } catch (ex) {
          console.debug(ex);
        } finally {
          setLoading(false);
        }
      };

      if (params.topicId) {
        fetchReplies();
      } else {
        console.debug("ForumDetailScreen: missing topicId");
      }
    }, [params.topicId])
  );

  // ── Lắng nghe Real-time qua WebSocket ──────────────────────────
  useEffect(() => {
    if (!params.topicId) return;

    const ws = new WebSocket(`ws://192.168.1.18:8000/ws/forum/${params.topicId}/`);

    ws.onmessage = (e) => {
      try {
        const response = JSON.parse(e.data);
        
        if (response.type === "new_reply") {
          const incomingData = response.data;
          console.log("Dữ liệu từ WS:", incomingData);
          
          // Hành động: XÓA BÌNH LUẬN
          if (incomingData.action === "DELETE_REPLY") {
            setTopic((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                replies: prev.replies.filter((r) => r.id !== incomingData.reply_id),
              };
            });
          } 
          // Hành động: XÓA CHỦ ĐỀ (Bị đá ra ngoài danh sách)
          else if (incomingData.action === "DELETE_TOPIC") {
            console.log("=== Đã nhận được lệnh XÓA TOPIC từ WebSocket ===");
            Alert.alert("Thông báo", "Chủ đề này đã bị xóa bởi ban quản trị.");
            nav.goBack();
          } 
          // Hành động: THÊM BÌNH LUẬN MỚI
          else {
            setTopic((prev) => {
              if (!prev) return prev;
              const isExist = prev.replies?.some((r) => r.id === incomingData.id);
              if (isExist) return prev;
              return {
                ...prev,
                replies: [...(prev.replies ?? []), incomingData],
              };
            });
          }
        }
      } catch (error) {
        console.debug("Lỗi xử lý dữ liệu WebSocket:", error);
      }
    };

    ws.onerror = (e) => {
      console.debug("Lỗi kết nối WebSocket:", e.message);
    };

    ws.onclose = (e) => {
      console.debug("WebSocket Forum đã đóng:", e.reason);
    };

    return () => {
      ws.close();
    };
  }, [params.topicId, nav]); // ✨ Đã sửa cấu trúc đưa nav vào mảng phụ thuộc chuẩn xác

  // ── Gửi bình luận mới ──────────────────────────────────────────
  const sendReply = async () => {
    if (!reply.trim()) return;
    try {
      setSending(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      
      await authApis(token).post(
        endpoints["forum-reply"](params.topicId),
        { content: reply.trim() }
      );
      setReply("");
      inputRef.current?.blur();
    } catch (ex) {
      console.debug(ex);
    } finally {
      setSending(false);
    }
  };

  // ── Xóa bình luận ──────────────────────────────────────────────
  const deleteReply = async (replyId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      await authApis(token).delete(endpoints["reply-delete"](replyId));
    } catch (ex) {
      console.debug(ex);
    }
  };

  // ── Xóa chủ đề (Topic) ──────────────────────────────────────────
  const deleteTopic = async (topicId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      
      // Gửi lệnh xóa lên server
      await authApis(token).delete(endpoints["forum-delete"](topicId));
      
      // ✨ Đã loại bỏ dòng setTopics lỗi ở đây. WebSocket tự động xử lý điều hướng đá ra ngoài.
    } catch (ex) {
      console.debug("ForumDetailScreen deleteTopic:", ex);
    }
  };

  const confirmDeleteTopic = () => {
    Alert.alert(
      "Xóa chủ đề",
      "Bạn có chắc chắn muốn xóa chủ đề này không? Tất cả bình luận sẽ bị mất.",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", style: "destructive", onPress: () => deleteTopic(params.topicId) },
      ]
    );
  };

  if (loading) return <Loading text="Đang tải chủ đề..." />;
  if (!topic)  return <Loading text="Không tìm thấy chủ đề." />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <Header title="Chi tiết chủ đề" showBack />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Card hiển thị thông tin bài viết tái sử dụng */}
        <TopicItem
          topic={{
            ...topic,
            title: topic.title, 
            content: topic.content,
          }}
          onPress={undefined} 
          showDelete={user?.id === topic.user?.id} 
          onDelete={confirmDeleteTopic} 
        />

        {/* Số lượng bình luận */}
        <Text variant="titleSmall" style={styles.replyHeader}>
          {topic.replies?.length ?? 0} bình luận
        </Text>

        {/* Danh sách các bình luận */}
        {(topic.replies ?? []).map((r, idx) => (
          <CommentSection
            key={`reply-${r.id ?? "unknown"}-${idx}`}
            reply={r}
            isOwner={user?.id === r.user?.id}
            onDelete={() => deleteReply(r.id)}
          />
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Ô nhập nội dung phản hồi */}
      {user && (
        <View style={styles.inputWrap}>
          <RNTextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Viết bình luận..."
            placeholderTextColor={colors.gray}
            value={reply}
            onChangeText={setReply}
            multiline
            maxLength={500}
          />
          {sending ? (
            <ActivityIndicator size={24} color={colors.primary} style={{ marginLeft: 8 }} />
          ) : (
            <IconButton
              icon="send"
              size={24}
              iconColor={reply.trim() ? colors.primary : colors.border}
              onPress={sendReply}
              disabled={!reply.trim()}
            />
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scroll:      { padding: 15 },
  replyHeader: { fontWeight: "700", color: colors.black, marginBottom: 10 },
  inputWrap:   {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: colors.black,
    fontSize: 14,
    maxHeight: 100,
  },
});

export default ForumDetailScreen;