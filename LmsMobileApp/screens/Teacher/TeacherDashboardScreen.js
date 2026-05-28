import React, { useState, useCallback, useContext } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Text, Icon, ActivityIndicator, Divider } from "react-native-paper";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/MyContext";
import { Header, ActionRow } from "../../components/common"; 

const TeacherDashboardScreen = () => {
    const navigation = useNavigation();
    

    const [user] = useContext(MyUserContext);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalCourses: 0,
        totalStudents: 0,
    });


    const fetchDashboardStats = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(endpoints["my-courses"]);
            const raw = res.data.results ?? res.data;
            const list = Array.isArray(raw) ? raw : [];

            setStats({
                totalCourses: list.length,
                totalStudents: list.reduce((sum, course) => sum + (course.students_count ?? 0), 0)
            });
        } catch (error) {
            console.error("Fetch dashboard error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => { fetchDashboardStats(); }, [])
    );


    const getDisplayName = () => {
        if (!user) return "Giảng viên";
        const fullName = `${user.last_name || ""} ${user.first_name || ""}`.trim();
        return fullName || user.username || "Giảng viên";
    };


    const renderStatCard = (title, value, icon, bgColor, iconColor) => (
        <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, { backgroundColor: bgColor }]}>
                <Icon source={icon} size={24} color={iconColor} />
            </View>
            <Text style={styles.statTitle}>{title}</Text>
            <Text style={styles.statValue}>{value}</Text>
        </View>
    );


    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            {/* Header dynamically greets the teacher */}
            <Header 
                title={`Xin chào, ${getDisplayName()} 👋`} 
                subtitle="Chào mừng bạn quay trở lại!" 
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchDashboardStats(true)}
                        tintColor="#4f46e5"
                    />
                }
            >
                <Text style={styles.sectionTitle}>Tổng quan</Text>
                <View style={styles.statsGrid}>
                    {renderStatCard("Khóa học", stats.totalCourses, "bookshelf", "#ede9fe", "#4f46e5")}
                    {renderStatCard("Học viên", stats.totalStudents, "account-group-outline", "#dcfce7", "#16a34a")}
                </View>

                <Divider style={styles.divider} />

                <Text style={styles.sectionTitle}>Quản lý hệ thống</Text>
                <View style={styles.menuContainer}>
                    <ActionRow
                        icon="book-open-variant"
                        label="Quản lý khóa học"
                        onPress={() => navigation.navigate("ManageCourse")}
                    />
                </View>
            </ScrollView>
        </View>
    );
};


const styles = StyleSheet.create({
    screen:          { flex: 1, backgroundColor: "#f8fafc" },
    centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" },
    loadingText:     { marginTop: 12, color: "#64748b", fontSize: 14 },
    scrollContent:   { padding: 20, paddingBottom: 40 },
    sectionTitle:    { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 16 },

    statsGrid:       { flexDirection: "row", gap: 12 },
    statCard: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    statIconWrapper: {
        width: 44, height: 44,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    statTitle: { fontSize: 13, color: "#64748b", fontWeight: "600", marginBottom: 4 },
    statValue: { fontSize: 22, fontWeight: "bold", color: "#0f172a" },

    divider: { marginVertical: 24, backgroundColor: "#e2e8f0" },
    menuContainer: {
        backgroundColor: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
});

export default TeacherDashboardScreen;
