import React from "react";
import { 
    View, 
    FlatList, 
    StyleSheet, 
    KeyboardAvoidingView, 
    Platform,
    SafeAreaView 
} from "react-native";
import { TextInput, IconButton, ActivityIndicator } from "react-native-paper";
import { Header } from "../../components/common";

/**
 * Reusable layout component for interactive screens (Notes, Comments).
 * Handles the keyboard, input field, and list rendering uniformly.
 */
const InteractionScreen = ({ 
    title, 
    data, 
    loading, 
    renderItem, 
    onSend, 
    input, 
    setInput, 
    placeholder, 
    ListEmptyComponent 
}) => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <Header title={title} showBack />
            
            <View style={styles.container}>
                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#4f46e5" />
                    </View>
                ) : (
                    <FlatList
                        data={data}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={ListEmptyComponent}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                {/* Keyboard handling for both iOS and Android */}
                <KeyboardAvoidingView 
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
                >
                    <View style={styles.inputWrapper}>
                        <TextInput
                            placeholder={placeholder}
                            value={input}
                            onChangeText={setInput}
                            style={styles.input}
                            mode="outlined"
                            outlineColor="transparent"
                            activeOutlineColor="#4f46e5" // Modern indigo color
                            multiline
                            maxLength={500}
                            placeholderTextColor="#a1a1aa"
                        />
                        <IconButton 
                            icon="send" 
                            iconColor={input.trim() ? "#ffffff" : "#a1a1aa"} 
                            containerColor={input.trim() ? "#4f46e5" : "#f4f4f5"}
                            size={24}
                            onPress={onSend} 
                            disabled={!input.trim()}
                            style={styles.sendButton}
                        />
                    </View>
                </KeyboardAvoidingView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: "#f8fafc" 
    },
    container: {
        flex: 1,
        justifyContent: "space-between",
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    listContent: { 
        padding: 16,
        paddingBottom: 24,
    },
    inputWrapper: { 
        flexDirection: "row", 
        alignItems: "flex-end", 
        padding: 12, 
        backgroundColor: "#ffffff",
        borderTopWidth: 1,
        borderColor: "#e2e8f0",
        paddingBottom: Platform.OS === "ios" ? 24 : 12,
    },
    input: { 
        flex: 1, 
        backgroundColor: "#f1f5f9",
        borderRadius: 24,
        marginRight: 8,
        fontSize: 15,
        maxHeight: 120, // Prevents input from taking over the screen
    },
    sendButton: {
        marginBottom: 4, 
    }
});

export default InteractionScreen;
