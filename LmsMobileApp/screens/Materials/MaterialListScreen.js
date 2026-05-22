import React, { useCallback, useState } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Text, Card, Button } from "react-native-paper";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import Styles, { colors } from "../../styles/Styles";
import { Header, Loading } from "../../components/common";

const MaterialListScreen = () => {
  const nav = useNavigation();
  const route = useRoute();
  const rawCourseId = route.params?.courseId;
  const courseId = typeof rawCourseId === "object" && rawCourseId !== null
    ? rawCourseId.id ?? rawCourseId.pk ?? rawCourseId.course_id ?? rawCourseId.course ?? rawCourseId
    : rawCourseId;

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchMaterials = async (refresh = false) => {
    if (!courseId) {
      setError("Không có thông tin khoá học.");
      setLoading(false);
      return;
    }

    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).get(endpoints["course-materials"]);
      const list = res.data.results ?? res.data;
      setMaterials(Array.isArray(list) ? list : []);
      setError("");
    } catch (ex) {
      console.debug(ex);
      setError("Không thể tải tài liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const headerActions = (
    <View style={styles.headerActions}>
      <Button
        compact
        mode="contained-tonal"
        textColor={colors.white}
        style={styles.headerAction}
        onPress={() => nav.navigate("ForumList", { courseId })}
      >
        Forum
      </Button>
      <Button
        compact
        mode="contained-tonal"
        textColor={colors.white}
        style={styles.headerAction}
        onPress={() => nav.navigate("QuizList", { courseId })}
      >
        Quiz
      </Button>
    </View>
  );

  const renderMaterial = ({ item }) => (
    <Card
      mode="outlined"
      style={styles.card}
      onPress={() => nav.navigate("MaterialDetail", { materialId: item.id, courseId })}
    >
      <Card.Content>
        <View style={Styles.between}>
          <Text variant="titleMedium" style={styles.cardTitle} numberOfLines={2}>
            {item.title || item.name || "Tài liệu"}
          </Text>
          <Text variant="label" style={styles.cardType}>
            {item.type || item.kind || "Tài liệu"}
          </Text>
        </View>
        {item.description ? (
          <Text variant="bodySmall" style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.screen}>
      <Header title="Tài liệu" showBack rightComponent={headerActions} />

      {loading && materials.length === 0 ? (
        <Loading text="Đang tải tài liệu..." />
      ) : (
        <FlatList
          data={materials}
          keyExtractor={(item) => item.id?.toString() ?? String(item?.pk ?? Math.random())}
          contentContainerStyle={materials.length ? styles.list : styles.emptyList}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => fetchMaterials(true)}
          ListEmptyComponent={
            <View style={[Styles.center, { flex: 1, padding: 30 }]}> 
              <Text variant="bodyLarge" style={{ color: colors.gray, textAlign: "center" }}>
                {error || "Chưa có tài liệu nào trong khoá học này."}
              </Text>
            </View>
          }
          renderItem={renderMaterial}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerAction: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  headerActionText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  list: {
    padding: 15,
    paddingBottom: 30,
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    color: colors.black,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  cardType: {
    color: colors.primary,
    fontWeight: "700",
  },
  cardDescription: {
    marginTop: 10,
    color: colors.gray,
    lineHeight: 20,
  },
});

export default MaterialListScreen;
