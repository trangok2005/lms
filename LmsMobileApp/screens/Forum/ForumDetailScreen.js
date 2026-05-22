import React, { useCallback, useContext, useState, useRef } from "react";
import {
  View, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, TextInput as RNTextInput,
} from "react-native";
import { Text, Avatar, Divider, IconButton, ActivityIndicator } from "react-native-paper";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/MyContext";
import Styles, { colors } from "../../styles/Styles";
import { Header, Loading } from "../../components/common";
import { CommentSection } from "../../components/forum";

const ForumDetailScreen = () => {
  const nav          = useNavigation();
  const { params }   = useRoute();
  const [user]       = useContext(MyUserContext);

  const [topic,    setTopic]    = useState(params.topic ?? null);
  const [loading,  setLoading]  = useState(!params.topic);
  const [reply,    setReply]    = useState("");
  const [sending,  setSending]  = useState(false);
  const inputRef               = useRef(null);

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

  const sendReply = async () => {
    if (!reply.trim()) return;
    try {
      setSending(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.debug("ForumDetailScreen: missing auth token for sendReply");
        return;
      }
      const res = await authApis(token).post(
        endpoints["forum-reply"](params.topicId),
        { content: reply.trim() }
      );
      setTopic((prev) => ({
        ...prev,
        replies: [...(prev.replies ?? []), res.data],
      }));
      setReply("");
      inputRef.current?.blur();
    } catch (ex) {
      console.debug(ex);
    } finally {
      setSending(false);
    }
  };

  const deleteReply = async (replyId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.debug("ForumDetailScreen: missing auth token for deleteReply");
        return;
      }
      await authApis(token).delete(endpoints["reply-delete"](replyId));
      setTopic((prev) => ({
        ...prev,
        replies: prev.replies.filter((r) => r.id !== replyId),
      }));
    } catch (ex) {
      console.debug(ex);
    }
  };

  if (loading) return <Loading text="Đang tải chủ đề..." />;
  if (!topic)  return <Loading text="Không tìm thấy chủ đề." />;

  const topicInitial = topic.user?.first_name?.[0]?.toUpperCase() ?? "U";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <Header title="Chi tiết chủ đề" showBack />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Nội dung topic ── */}
        <View style={styles.topicCard}>
          {/* Tác giả */}
          <View style={[Styles.row, Styles.mb10]}>
            {topic.user?.avatar ? (
              <Avatar.Image size={40} source={{ uri: topic.user.avatar }} />
            ) : (
              <Avatar.Text size={40} label={topicInitial} style={{ backgroundColor: colors.primary }} />
            )}
            <View style={{ marginLeft: 10 }}>
              <Text variant="labelLarge" style={{ fontWeight: "700", color: colors.black }}>
                {topic.user?.first_name} {topic.user?.last_name}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.gray }}>
                {topic.course_name}  ·  {new Date(topic.created_date).toLocaleDateString("vi-VN")}
              </Text>
            </View>
          </View>

          {/* Tiêu đề */}
          <Text variant="titleMedium" style={styles.topicTitle}>{topic.title}</Text>
          <Divider style={Styles.mb10} />

          {/* Nội dung */}
          <Text variant="bodyMedium" style={{ color: colors.black, lineHeight: 22 }}>
            {topic.content}
          </Text>
        </View>

        {/* ── Replies ── */}
        <Text variant="titleSmall" style={styles.replyHeader}>
          {topic.replies?.length ?? 0} bình luận
        </Text>

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

      {/* ── Input trả lời ── */}
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
  topicCard:   {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  topicTitle:  { fontWeight: "800", color: colors.black, marginBottom: 10, lineHeight: 22 },
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