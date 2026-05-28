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


  const pageRef     = useRef(1);
  const hasMoreRef = useRef(true);
  const fetchingRef = useRef(false); // Chặn gọi đồng thời khi lướt nhanh


  const fetchTopics = useCallback(async (reset = false) => {
    if (!courseId) return;

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
        { params: { page: currentPage } }
      );
      const results = res.data.results ?? res.data;


      setTopics((prev) => {
        if (reset) return results;
        const existingIds = new Set(prev.map((t) => t.id));
        const fresh = results.filter((t) => !existingIds.has(t.id));
        return [...prev, ...fresh];
      });


      hasMoreRef.current = !!res.data.next;
      pageRef.current    = currentPage + 1;

    } catch (ex) {
      console.debug("ForumListScreen fetchTopics:", ex);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [courseId]);


  useFocusEffect(
    useCallback(() => {
      pageRef.current    = 1;
      hasMoreRef.current = true;
      fetchTopics(true);
    }, [fetchTopics])
  );


  const handleEndReached = useCallback(() => {
    if (!loading && hasMoreRef.current) {
      fetchTopics(false);
    }
  }, [loading, fetchTopics]);


  const showInitialLoader = loading && topics.length === 0;

  return (
    <View style={s.root}>
      <Header title="Diễn đàn" showBack />

      {showInitialLoader ? (
        <Loading text="Đang tải diễn đàn..." />
      ) : (
        <FlatList
          data={topics}
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
              onDelete={undefined} // Ẩn hoàn toàn tính năng xóa tại chỗ ở danh sách
              showDelete={false}   // Nút xóa đã được gom vào màn hình chi tiết an toàn
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
