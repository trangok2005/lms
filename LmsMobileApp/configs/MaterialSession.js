import AsyncStorage from "@react-native-async-storage/async-storage";

export const MaterialSession = {

    saveId: async (id) => {
        try {
            await AsyncStorage.setItem("current_material_id", id.toString());
        } catch (e) {
            console.error("Failed to save material id", e);
        }
    },
 
    getId: async () => {
        try {
            return await AsyncStorage.getItem("current_material_id");
        } catch (e) {
            console.error("Failed to get material id", e);
            return null;
        }
    },
};
