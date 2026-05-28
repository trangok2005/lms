import React, { useState, useEffect } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Text, Searchbar } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { authApis, endpoints } from "../../configs/Apis";
import { Header, Loading } from "../../components/common"; 
import MaterialCard from "../../components/materials/MaterialCard";

const MaterialSearchScreen = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.trim().length > 0) handleSearch();
            else setMaterials([]);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("token");
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
            <Header title="Search Materials" showBack />
            
            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Search for lessons..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchbar}
                />
            </View>

            {loading ? (
                <Loading text="Searching..." />
            ) : (
                <FlatList
                    data={materials}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => <MaterialCard item={item} />}
                    ListEmptyComponent={
                        searchQuery.length > 0 ? (
                            <Text style={styles.emptyText}>No results found.</Text>
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
