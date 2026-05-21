import React, { useCallback, useContext, useRef, useState } from "react";
import { View, FlatList, StyleSheet, Alert } from "react-native";
import { FAB } from "react-native-paper";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/MyContext";
import Styles, { colors } from "../../styles/Styles";
import { Header, Loading } from "../../components/common";
import { TopicItem } from "../../components/forum";

const ForumListScreen = () => {
  const nav      = useNavigation();
  const route    = useRoute();
  const [user]   = useContext(MyUserContext);
  const courseId = route.params?.courseId;

  const [topics,  setTopics]  = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Dùng ref thay vì state cho pagination
  // state update bất đồng bộ → closure trong fetchTopics
  //        đọc page/hasMore cũ → trùng key / fetch sai trang.
  const pageRef    = useRef(1);
  const hasMoreRef = useRef(true);
  const fetchingRef = useRef(false); // chặn gọi đồng thời

  // ── Core fetch ──────────────────────────────────────────
  const fetchTopics = useCallback(async (reset = false) => {
    if (!courseId) return;

    // Nếu đang fetch hoặc hết data (và không phải reset) → bỏ qua
    if (fetchingRef.current) return;
    if (!reset && !hasMoreRef.current) return;

    fetchingRef.current = true;
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const currentPage = reset ? 1 : pageRef.current;

      const res     = await authApis(token).get(
        endpoints["forum-topics"](courseId),
        { params: { page: currentPage } }   // gửi page lên server
      );
      const results = res.data.results ?? res.data;

      // Cập nhật list: reset → thay mới, load more → append (dedup theo id)
      setTopics((prev) => {
        if (reset) return results;
        const existingIds = new Set(prev.map((t) => t.id));
        const fresh = results.filter((t) => !existingIds.has(t.id));
        return [...prev, ...fresh];
      });

      // Cập nhật refs (đồng bộ, không gây re-render)
      hasMoreRef.current = !!res.data.next;
      pageRef.current    = currentPage + 1;

    } catch (ex) {
      console.error("ForumListScreen fetchTopics:", ex);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [courseId]);

  // ── Reset & fetch mỗi khi màn hình được focus ──────────
  useFocusEffect(
    useCallback(() => {
      // Reset refs TRƯỚC khi gọi fetch — không phụ thuộc setState
      pageRef.current    = 1;
      hasMoreRef.current = true;
      fetchTopics(true);
    }, [fetchTopics])
  );

  // ── Load more (infinite scroll) ─────────────────────────
  const handleEndReached = useCallback(() => {
    if (!loading && hasMoreRef.current) {
      fetchTopics(false);
    }
  }, [loading, fetchTopics]);

  // ── Delete ───────────────────────────────────────────────
  const deleteTopic = async (topicId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      await authApis(token).delete(endpoints["forum-delete"](topicId));
      setTopics((prev) => prev.filter((t) => t.id !== topicId));
    } catch (ex) {
      console.error("ForumListScreen deleteTopic:", ex);
    }
  };

  const confirmDelete = (topicId) => {
    Alert.alert(
      "Xóa chủ đề",
      "Bạn có chắc muốn xóa chủ đề này?",
      [
        { text: "Huỷ",  style: "cancel" },
        { text: "Xoá",  style: "destructive", onPress: () => deleteTopic(topicId) },
      ]
    );
  };

  // ── Render ───────────────────────────────────────────────
  const showInitialLoader = loading && topics.length === 0;

  return (
    <View style={s.root}>
      <Header title="Diễn đàn" showBack />

      {showInitialLoader ? (
        <Loading text="Đang tải diễn đàn..." />
      ) : (
        <FlatList
          data={topics}
          // id là duy nhất — không còn trùng key khi dedup đúng
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loading && topics.length > 0 ? <Loading /> : null}
          ListEmptyComponent={
            <View style={[Styles.center, { marginTop: 60 }]}>
              <Loading text="Chưa có chủ đề nào." />
            </View>
          }
          renderItem={({ item }) => (
            <TopicItem
              topic={item}
              onPress={() => nav.navigate("ForumDetail", { topicId: item.id, topic: item })}
              showDelete={user?.id === item.user?.id}
              onDelete={() => confirmDelete(item.id)}
            />
          )}
        />
      )}

      {user && (
        <FAB
          icon="plus"
          style={s.fab}
          color={colors.white}
          onPress={() => nav.navigate("CreateTopic", { courseId })}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 15, paddingBottom: 80 },
  fab:  {
    position: "absolute", right: 20, bottom: 20,
    backgroundColor: colors.primary, borderRadius: 16,
  },
});

export default ForumListScreen;