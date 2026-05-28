import React from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Text, Chip } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../styles/Styles";

const MaterialCard = ({ item }) => {
    const nav = useNavigation();

    const getIconByType = (type) => {
        if (type === 'video') return 'play-circle-outline';
        if (type === 'pdf') return 'file-pdf-box';
        return 'presentation-play';
    };

    const getDiffColor = (diff) => {
        if (diff === 'easy')   return { bg: '#dcfce7', text: '#16a34a' };
        if (diff === 'hard')   return { bg: '#fee2e2', text: '#dc2626' };
        return                        { bg: '#fef9c3', text: '#ca8a04' }; // medium
    };

    const diffColor = getDiffColor(item.difficulty);

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            style={styles.card}
            onPress={() => nav.navigate("MaterialDetail", { materialId: item.id })}
        >
            {/* Thumbnail */}
            <View style={styles.imageContainer}>
                {item.thumbnail ? (
                    <Image source={{ uri: item.thumbnail.url || item.thumbnail }} style={styles.image} />
                ) : (
                    <View style={[styles.image, styles.placeholder]}>
                        <Text style={{ color: colors.gray }}>No Image</Text>
                    </View>
                )}
            </View>

            {/* Thông tin */}
            <View style={styles.infoContainer}>
                <Text variant="titleMedium" style={styles.title} numberOfLines={2}>
                    {item.title}
                </Text>

                <View style={styles.badgeRow}>
                    <Chip
                        icon={getIconByType(item.material_type)}
                        compact
                        style={styles.typeChip}
                        textStyle={styles.chipText}
                    >
                        {item.material_type?.toUpperCase()}
                    </Chip>
                    <Chip
                        icon="signal"
                        compact
                        style={[styles.diffChip, { backgroundColor: diffColor.bg }]}
                        textStyle={[styles.chipText, { color: diffColor.text }]}
                    >
                        {item.difficulty?.toUpperCase()}
                    </Chip>
                </View>

                {item.duration_minutes > 0 && (
                    <Text variant="labelSmall" style={styles.duration}>
                        ⏱ {item.duration_minutes} phút
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        backgroundColor: "white",
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    imageContainer: { width: 100, height: 80, borderRadius: 12, overflow: "hidden" },
    image: { width: "100%", height: "100%", resizeMode: "cover" },
    placeholder: { backgroundColor: "#e2e8f0", justifyContent: "center", alignItems: "center" },
    infoContainer: { flex: 1, marginLeft: 12, justifyContent: "space-between" },
    title: { fontWeight: "bold", color: "#1e293b", marginBottom: 6 },

    // FIX: bỏ height cứng, dùng paddingVertical để chip không bị cắt
    badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4, alignItems: "center" },
    typeChip: { backgroundColor: "#e0e7ff" },
    diffChip: {},
    chipText: { fontSize: 10, fontWeight: "700", lineHeight: 14 },

    duration: { color: "#64748b", marginTop: 2 },
});

export default MaterialCard;
