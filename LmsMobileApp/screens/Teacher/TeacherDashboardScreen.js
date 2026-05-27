import React, { useState, useCallback } from "react";
import {
    View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image
} from "react-native";
import { Text, Icon, ActivityIndicator, Divider } from "react-native-paper";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Assuming you have these in your config
// import { authApis, endpoints } from "../../configs/Apis";

// ── Main Component ───────────────────────────────────────
const TeacherDashboardScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Initial state without TypeScript interfaces
    const [stats, setStats] = useState({
        totalCourses: 0,
        totalStudents: 0,
        totalRevenue: 0,
      
    });

    // ── Fetch Dashboard Data ───────────────────────────────
    const fetchDashboardStats = async () => {
        try {
            // const token = await AsyncStorage.getItem("token");
            // const res = await authApis(token).get(endpoints["teacher-stats"]());
            // setStats(res.data);

            // Mocking API delay and response for demonstration
            setTimeout(() => {
                setStats({
                    totalCourses: 12,
                    totalStudents: 345,
                    totalRevenue: 15500000,
                    unreadForum: 5,
                });
                setLoading(false);
                setRefreshing(false);
            }, 800);
        } catch (error) {
            console.error("Fetch dashboard error:", error);
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDashboardStats();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardStats();
    };

    // ── Render Helpers ─────────────────────────────────────
    const formatCurrency = (amount) => {
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " ₫";
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

    const renderMenuItem = (title, subtitle, icon, routeName, badge) => (
        <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate(routeName)}
        >
            <View style={styles.menuIconWrapper}>
                <Icon source={icon} size={24} color="#4f46e5" />
            </View>
            <View style={styles.menuTextContent}>
                <Text style={styles.menuTitle}>{title}</Text>
                <Text style={styles.menuSubtitle}>{subtitle}</Text>
            </View>
            {badge && badge > 0 ? (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            ) : null}
            <Icon source="chevron-right" size={24} color="#cbd5e1" />
        </TouchableOpacity>
    );

    // ── Main Render ─────────────────────────────────────────
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
            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.greeting}>Xin chào, Giảng viên 👋</Text>
                        <Text style={styles.subGreeting}>Chào mừng bạn quay trở lại!</Text>
                    </View>
                    <Image 
                        source={{ uri: "https://via.placeholder.com/100" }} 
                        style={styles.avatar} 
                    />
                </View>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />
                }
            >
                {/* Stats Grid */}
                <Text style={styles.sectionTitle}>Tổng quan</Text>
                <View style={styles.statsGrid}>
                    {renderStatCard("Khóa học", stats.totalCourses, "bookshelf", "#ede9fe", "#4f46e5")}
                    {renderStatCard("Học viên", stats.totalStudents, "account-group-outline", "#dcfce7", "#16a34a")}
                    {renderStatCard("Doanh thu", formatCurrency(stats.totalRevenue), "cash-multiple", "#fef9c3", "#ca8a04")}
                   
                </View>

                <Divider style={styles.divider} />

                {/* Quick Actions / Navigation Menu */}
                <Text style={styles.sectionTitle}>Quản lý hệ thống</Text>
                <View style={styles.menuContainer}>
                    {renderMenuItem(
                        "Quản lý khóa học", 
                        "Thêm, sửa, xóa khóa học và tài liệu", 
                        "book-open-variant", 
                        "ManageCourse"
                    )}
                    
                  
                    
                   
                    
                 
                </View>
            </ScrollView>
        </View>
    );
};

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8fafc",
    },
    loadingText: {
        marginTop: 12,
        color: "#64748b",
        fontSize: 14,
    },
    // Header
    header: {
        backgroundColor: "#4f46e5",
        paddingTop: 60, 
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 4,
        shadowColor: "#4f46e5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    greeting: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 4,
    },
    subGreeting: {
        color: "#c7d2fe",
        fontSize: 14,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: "#fff",
    },
    // Content
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 16,
    },
    // Stats Grid
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 12,
    },
    statCard: {
        width: "48%", 
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        marginBottom: 4,
    },
    statIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    statTitle: {
        fontSize: 13,
        color: "#64748b",
        fontWeight: "600",
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#0f172a",
    },
    divider: {
        marginVertical: 24,
        backgroundColor: "#e2e8f0",
    },
    // Menu Container
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
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    menuIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: "#f8fafc",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    menuTextContent: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#0f172a",
        marginBottom: 4,
    },
    menuSubtitle: {
        fontSize: 13,
        color: "#64748b",
    },
    badge: {
        backgroundColor: "#ef4444",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginRight: 8,
    },
    badgeText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "bold",
    },
});

export default TeacherDashboardScreen;
