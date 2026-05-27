import React, { useEffect, useState } from "react";
import { ActivityIndicator, DeviceEventEmitter, FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, Icon, Surface } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import usePagination from "../../hooks/usePagination";
import Styles, { colors } from "../../styles/Styles";
import { Header } from "../../components/common";

// Khớp NotificationType của model
const TYPE_CONFIG = {
  NEW_REPLY: {
    icon:  "comment-text",
    color: colors.primary,
    bg:    "#E8F5F0",
    label: "Diễn đàn",
  },
  NEW_QUIZ: {
    icon:  "clipboard-check",
    color: colors.secondary,
    bg:    "#EEEDF8",
    label: "Bài kiểm tra",
  },
};

const NotificationListScreen = () => {
  const nav = useNavigation();

  const { data: notifications, loading, hasMore, refresh, loadMore, page } = usePagination(
    endpoints["notifications"],
    {},
    true
  );

  const [localNotifications, setLocalNotifications] = useState([]);

  useEffect(() => {
    const nextNotifications = notifications.map((item) => {
      const previous = localNotifications.find((n) => n.id === item.id);
      return previous ? { ...item, is_read: previous.is_read } : item;
    });
    setLocalNotifications(nextNotifications);
    DeviceEventEmitter.emit(
      "UPDATE_BADGE_COUNT",
      nextNotifications.filter((n) => !n.is_read).length
    );
  }, [notifications]);

  const unreadCount = localNotifications.filter((n) => !n.is_read).length;

  // ── Đánh dấu đã đọc + navigate ───────────────────────
  const handlePress = async (item) => {
    setLocalNotifications((prev) => {
      const next = prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n));
      DeviceEventEmitter.emit(
        "UPDATE_BADGE_COUNT",
        next.filter((n) => !n.is_read).length
      );
      return next;
    });

    try {
      const token = await AsyncStorage.getItem("token");
      await authApis(token).patch(endpoints["notification-read"](item.id));
    } catch (ex) {
      console.error(ex);
    }

    const d = item.data ?? {};
    if (item.notification_type === "NEW_REPLY") {
      console.log("Dữ liệu điều hướng:", d);
      const topicId = item.forum_id ?? d.topic_id ?? d.forum_id;
      if (topicId) nav.navigate("ForumDetail", { topicId });
    } else if (item.notification_type === "NEW_QUIZ") {
      if (d.quiz_id) nav.navigate("QuizTake", { quizId: d.quiz_id });
    }
  };

  // ── Đánh dấu tất cả đã đọc ───────────────────────────
  const markAllRead = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      await authApis(token).post(endpoints["notifications-read-all"]);
      setLocalNotifications((prev) => {
        const next = prev.map((n) => ({ ...n, is_read: true }));
        DeviceEventEmitter.emit("UPDATE_BADGE_COUNT", 0);
        return next;
      });
    } catch (ex) {
      console.error(ex);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title="Thông báo"
        showBack
        rightComponent={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
              <Text variant="bodySmall" style={{ color: colors.white, fontWeight: "600" }}>
                Đọc tất cả
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <FlatList
        data={localNotifications}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={refresh}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loading
            ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
            : !hasMore && localNotifications.length > 0
              ? <Text style={styles.endText}>Đã hiển thị tất cả</Text>
              : null
        }
        ListEmptyComponent={
          !loading && (
            <View style={[Styles.center, { marginTop: 80 }]}>
              <Icon source="bell-off-outline" size={48} color={colors.border} />
              <Text variant="bodyLarge" style={{ color: colors.gray, marginTop: 12 }}>
                Chưa có thông báo nào
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <NotificationItem item={item} onPress={() => handlePress(item)} />
        )}
      />
    </View>
  );
};

// ── NotificationItem ─────────────────────────────────────
const NotificationItem = ({ item, onPress }) => {
  const cfg = TYPE_CONFIG[item.notification_type] ?? {
    icon: "bell", color: colors.gray, bg: colors.bg, label: "Thông báo",
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Surface
        style={[styles.card, !item.is_read && styles.cardUnread]}
        elevation={1}
      >
        <View style={Styles.row}>
          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
            <Icon source={cfg.icon} size={22} color={cfg.color} />
          </View>

          {/* Nội dung */}
          <View style={styles.content}>
            <View style={[Styles.between, Styles.mb10]}>
              <Text
                variant="titleSmall"
                style={[styles.title, !item.is_read && { color: colors.black }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {/* Dot chưa đọc */}
              {!item.is_read && (
                <View style={[styles.unreadDot, { backgroundColor: cfg.color }]} />
              )}
            </View>

            {/* message — đúng field model */}
            <Text variant="bodySmall" style={styles.body} numberOfLines={2}>
              {item.message}
            </Text>

            {/* Type badge + thời gian */}
            <View style={[Styles.row, { marginTop: 6, gap: 8 }]}>
              <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.typeText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
              <Text variant="bodySmall" style={styles.time}>
                {new Date(item.created_date).toLocaleString("vi-VN")}
              </Text>
            </View>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  list:        { padding: 15, paddingBottom: 30 },
  endText:     { textAlign: "center", color: colors.gray, fontSize: 12, paddingVertical: 15 },
  markAllBtn:  { marginRight: 12, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  card:        { backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 8 },
  cardUnread:  { borderLeftWidth: 3, borderLeftColor: colors.primary },
  iconWrap:    { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginRight: 12 },
  content:     { flex: 1 },
  title:       { fontWeight: "600", color: colors.gray, flex: 1, marginRight: 6 },
  body:        { color: colors.gray, lineHeight: 18 },
  unreadDot:   { width: 8, height: 8, borderRadius: 4 },
  typeBadge:   { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  typeText:    { fontSize: 10, fontWeight: "700" },
  time:        { color: colors.gray, fontSize: 11 },
});

export default NotificationListScreen;