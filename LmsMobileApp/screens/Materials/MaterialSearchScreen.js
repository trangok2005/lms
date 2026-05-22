import React, { useState, useEffect } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Text, Searchbar, ActivityIndicator } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { Header } from "../../components/common";
import MaterialCard from "../../components/materials/MaterialCard";

const MaterialSearchScreen = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(false);

    // Dùng Debounce để không gọi API liên tục khi đang gõ
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.trim().length > 0) handleSearch();
            else setMaterials([]); // Xóa list nếu ô tìm kiếm trống
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("token");
            // Yêu cầu bạn thêm endpoint này vào Apis.js: "material-search": (q) => `/Material/?q=${q}`
            const res = await authApis(token).get(`${endpoints["material-search"](searchQuery)}`);
            const list = res.data.results ?? res.data;
            setMaterials(Array.isArray(list) ? list : []);
        } catch (ex) {
            console.error(ex);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.screen}>
            <Header title="Tìm kiếm tài liệu" showBack />
            
            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Nhập tên bài học..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchbar}
                />
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={materials}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => <MaterialCard item={item} />}
                    ListEmptyComponent={
                        searchQuery.length > 0 ? (
                            <Text style={styles.emptyText}>Không tìm thấy kết quả phù hợp.</Text>
                        ) : null
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#f8fafc" },
    searchContainer: { padding: 16, backgroundColor: "white", elevation: 2 },
    searchbar: { backgroundColor: "#f1f5f9", borderRadius: 12 },
    list: { padding: 16 },
    emptyText: { textAlign: "center", marginTop: 50, color: "gray" }
});

export default MaterialSearchScreen;
