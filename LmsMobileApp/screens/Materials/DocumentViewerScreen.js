// Mới
import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import * as WebBrowser from "expo-web-browser";
import { useNavigation } from "@react-navigation/native";
import { Header } from "../../components/common";

export default function DocumentViewerScreen({ route }) {
    const { fileUrl, title = "Tài liệu" } = route.params || {};
    const navigation = useNavigation();

    // Tự động mở browser khi vào màn hình
    useEffect(() => {
        if (fileUrl) {
            openDocument();
        }
    }, [fileUrl]);

    const openDocument = async () => {
        try {
            await WebBrowser.openBrowserAsync(fileUrl);
        } catch (e) {
            console.error("Không thể mở tài liệu:", e);
        } finally {
            // Sau khi đóng browser, quay lại màn hình trước
            navigation.goBack();
        }
    };

    // Hiển thị loading trong lúc chờ browser mở
    if (!fileUrl) {
        return (
            <View style={styles.screen}>
                <Header title={title} showBack />
                <View style={styles.center}>
                    <Text style={styles.errorText}>
                        Không tìm thấy file tài liệu.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <Header title={title} showBack />
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={styles.loadingText}>Đang mở tài liệu...</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { 
        flex: 1, 
        backgroundColor: "#f8fafc" 
    },
    center: { 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center",
        gap: 16
    },
    loadingText: { 
        color: "#64748b", 
        fontSize: 15 
    },
    errorText: { 
        color: "#ef4444", 
        fontSize: 15 
    }
});
