import React, { useCallback, useContext, useState, useRef, useEffect } from "react";
import {
  View, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, TextInput as RNTextInput, Alert
} from "react-native";
import { Text, IconButton, ActivityIndicator } from "react-native-paper";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/MyContext";
import Styles, { colors } from "../../styles/Styles";
import { Header, Loading } from "../../components/common";
import { CommentSection, TopicItem } from "../../components/forum";

const ForumDetailScreen = () => {
  const nav = useNavigation();
  const { topicId, topic: initialTopic } = useRoute().params;
  const [user] = useContext(MyUserContext);

  const [topic, setTopic] = useState(initialTopic ?? null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);


  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        if (!topicId) {
          console.debug("ForumDetailScreen: Thiếu topicId");
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          const token = await AsyncStorage.getItem("token");
          let currentTopic = topic;


          if (!currentTopic) {
            const topicRes = await authApis(token).get(endpoints["forum-topic-detail"](topicId));
            currentTopic = topicRes.data;
          }


          const repliesRes = await authApis(token)
            .get(endpoints["forum-reply"](topicId))
            .catch(() => ({ data: [] }));

          const replies = repliesRes.data.results ?? repliesRes.data ?? [];
          

          setTopic({ ...currentTopic, replies });
        } catch (ex) {
          console.debug("Lỗi khi tải dữ liệu diễn đàn:", ex);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [topicId]) // Chạy lại khi ID thay đổi
  );


  useEffect(() => {
    if (!topicId) return;

    const ws = new WebSocket(`ws://192.168.1.18:8000/ws/forum/${topicId}/`);

    ws.onmessage = (e) => {
      try {
        const response = JSON.parse(e.data);
        
        if (response.type === "new_reply") {
          const incomingData = response.data;
          console.log("Dữ liệu cập nhật từ WS:", incomingData);
          
          if (incomingData.action === "DELETE_REPLY") {
            setTopic((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                replies: prev.replies.filter((r) => r.id !== incomingData.reply_id),
              };
            });
          } 
          else if (incomingData.action === "DELETE_TOPIC") {
            Alert.alert("Thông báo", "Chủ đề này đã bị xóa bởi ban quản trị.");
            nav.goBack();
          } 
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

    ws.onerror = (e) => console.debug("Lỗi kết nối WebSocket:", e.message);
    ws.onclose = (e) => console.debug("WebSocket Forum đã đóng:", e.reason);

    return () => ws.close();
  }, [topicId, nav]);


  const sendReply = async () => {
    if (!reply.trim()) return;
    try {
      setSending(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      
      await authApis(token).post(
        endpoints["forum-reply"](topicId),
        { content: reply.trim() }
      );
      setReply("");
      inputRef.current?.blur();
    } catch (ex) {
      console.debug("Gửi phản hồi thất bại:", ex);
    } finally {
      setSending(false);
    }
  };


  const deleteReply = async (replyId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      await authApis(token).delete(endpoints["reply-delete"](replyId));
    } catch (ex) {
      console.debug("Xóa phản hồi thất bại:", ex);
    }
  };


  const deleteTopic = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      await authApis(token).delete(endpoints["forum-delete"](topicId));
    } catch (ex) {
      console.debug("Xóa chủ đề thất bại:", ex);
    }
  };

  const confirmDeleteTopic = () => {
    Alert.alert(
      "Xóa chủ đề",
      "Bạn có chắc chắn muốn xóa chủ đề này không? Tất cả bình luận sẽ bị mất.",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", style: "destructive", onPress: deleteTopic },
      ]
    );
  };


  if (loading) return <Loading text="Đang tải dữ liệu..." />;
  if (!topic)  return <Loading text="Không tìm thấy chủ đề." />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <Header title="Chi tiết chủ đề" showBack />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Thông tin chi tiết bài viết gốc */}
        <TopicItem
          topic={topic}
          onPress={undefined} 
          showDelete={user?.id === topic.user?.id} 
          onDelete={confirmDeleteTopic} 
        />

        {/* Thống kê đếm số lượng phản hồi */}
        <Text variant="titleSmall" style={styles.replyHeader}>
          {topic.replies?.length ?? 0} bình luận
        </Text>

        {/* Vòng lặp kết xuất danh sách bình luận */}
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

      {/* Thanh nhập liệu bình luận */}
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