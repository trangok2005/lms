import React from "react";
import { View, TouchableOpacity, Image } from "react-native";
import { Text, Avatar } from "react-native-paper";
import * as ImgPicker from "expo-image-picker";
import Styles, { colors } from "../../styles/Styles";

const AvatarPicker = ({ avatarUri, onImagePicked, title = "Chọn ảnh..." }) => {
  
  const picker = async () => {
    let { status } = await ImgPicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert("Hệ thống cần quyền truy cập thư viện ảnh!");
    } else {
      const result = await ImgPicker.launchImageLibraryAsync({
        mediaTypes: ImgPicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1
      });
      if (!result.canceled) {
        onImagePicked(result.assets[0]);
      }
    }
  };

  return (
    <TouchableOpacity 
      style={[Styles.row, Styles.p15, { backgroundColor: colors.bg, borderRadius: 12 }]} 
      onPress={picker} 
      activeOpacity={0.8}
    >
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={Styles.avatar} />
      ) : (
        <Avatar.Icon size={80} icon="camera-plus" style={{ backgroundColor: "#E8F5F0" }} />
      )}
      <View style={{ marginLeft: 16, flex: 1 }}>
        <Text variant="bodyMedium" style={{ fontWeight: "600", color: colors.black }}>
          {avatarUri ? "Đã chọn ảnh thành công" : title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default AvatarPicker;