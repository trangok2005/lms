// screens/materials/DocumentViewerScreen.js
import React from "react";
import { View, StyleSheet, Dimensions, Pdf} from "react-native";


const DocumentViewerScreen = ({ route }) => {
    const { fileUrl } = route.params;

    return (
        <View style={styles.container}>
            <Pdf
                source={{ uri: fileUrl, cache: true }}
                style={styles.pdf}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "flex-start", alignItems: "center" },
    pdf: { flex: 1, width: Dimensions.get('window').width, height: Dimensions.get('window').height }
});

export default DocumentViewerScreen;
