import React, { useCallback, useState } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Text } from "react-native-paper"; // Đã bỏ ActivityIndicator
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { authApis, endpoints } from "../../configs/Apis";
import { Header, Loading } from "../../components/common"; // Import thêm Loading từ index của common
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
            
            setMaterials(Array.isArray(list) 
                ? list.sort((a, b) => a.order_index - b.order_index) 
                : []
            );
            setError("");
        } catch (ex) {
            console.error(ex);
            setError("Unable to load materials.");
        } finally {
            setLoading(false);
        }
    };


    useFocusEffect(
        useCallback(() => {
            fetchMaterials();
        }, [courseId])
    );

    return (
        <View style={styles.screen}>
            <Header 
                title="Tài liệu" 
                showBack={true} 
                showSearch={true}
                onSearch={() => nav.navigate("material-search")}
            />
            
            {loading ? (
         
                <Loading text="Đang tải..." />
            ) : (
                <FlatList
                    data={materials}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => <MaterialCard item={item} />}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>
                            {error || "No materials available."}
                        </Text>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f8fafc" },
    list: { padding: 16 },
    emptyText: { textAlign: "center", marginTop: 50, color: "gray" }
});

export default MaterialListScreen;
