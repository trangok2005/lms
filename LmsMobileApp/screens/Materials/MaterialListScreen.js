import React, { useCallback, useState } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Text, ActivityIndicator, IconButton } from "react-native-paper";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { Header } from "../../components/common";
import MaterialCard from "../../components/materials/MaterialCard";

const MaterialListScreen = () => {
    const nav = useNavigation();
    const route = useRoute();
    const { courseId } = route.params;

    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchMaterials = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(endpoints["course-materials"](courseId));
            const list = res.data.results ?? res.data;
            setMaterials(Array.isArray(list) ? list.sort((a, b) => a.order_index - b.order_index) : []);
            setError("");
        } catch (ex) {
            console.error(ex);
            setError("Không thể tải tài liệu.");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMaterials();
        }, [courseId])
    );

    // Nút tìm kiếm trên Header
    const headerRight = (
        <IconButton
            icon="magnify"
            iconColor="white"
            size={26}
            onPress={() => nav.navigate("material-search")}
        />
    );

    return (
        <View style={styles.screen}>
            <Header 
                title="Danh sách bài học" 
                showBack 
                rightComponent={headerRight} 
            />
            
            {loading ? (
                <ActivityIndicator style={styles.center} size="large" />
            ) : (
                <FlatList
                    data={materials}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => <MaterialCard item={item} />}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>{error || "Chưa có tài liệu nào."}</Text>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f8fafc" },
    list: { padding: 16 },
    center: { flex: 1, justifyContent: "center" },
    emptyText: { textAlign: "center", marginTop: 50, color: "gray" }
});

export default MaterialListScreen;
