import React, { useContext, useState } from "react";
import { View, KeyboardAvoidingView, Platform, ScrollView, Image, TouchableOpacity } from "react-native";
import { Text, TextInput, Button, HelperText, Surface, Avatar } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/MyContext";
import Styles, { colors } from "../../styles/Styles";
import {AvatarPicker} from "../../components/common/index"

const FIELDS = [
  { field: "first_name", label: "Tên", icon: "text-short" },
  { field: "last_name", label: "Họ và tên lót", icon: "text"},
  { field: "email", label: "Email", icon: "email"},
];

const EditProfileScreen = () => {
  const nav = useNavigation();
  const { params } = useRoute();
  const [, dispatch] = useContext(MyUserContext);

  const [form, setForm] = useState({
    first_name: params?.profile?.first_name ?? "",
    last_name: params?.profile?.last_name ?? "",
    email: params?.profile?.email ?? "",
  });
  const [avatar, setAvatar] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const pickImage = async () => {
    const { status } = await ImgPicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { 
      alert("Hệ thống cần quyền truy cập ảnh của bạn!"); 
      return; 
    }
    const result = await ImgPicker.launchImageLibraryAsync({
      mediaTypes: ImgPicker.MediaTypeOptions.Images,
      allowsEditing: true, 
      aspect: [1, 1], 
      quality: 0.8,
    });
    if (!result.canceled) setAvatar(result.assets[0]);
  };

  const validate = () => {
    if (!form.first_name?.trim()) { setErr("Vui lòng nhập Tên"); return false; }
    if (!form.last_name?.trim())  { setErr("Vui lòng nhập Họ và tên lót"); return false; }
    return true;
  };

  const save = async () => {
    if (!validate()) return;
    setErr("");
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const data  = new FormData();
      
      for (let key in form) {
        if (form[key]) data.append(key, form[key]);
      }
      
      if (avatar) {
        data.append("avatar", {
          uri:  avatar.uri,
          name: avatar.fileName || "avatar.jpg",
          type: "image/jpeg",
        });
      }

      const res = await authApis(token).patch(endpoints["current-user"], data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
 
      dispatch({ type: "UPDATE", payload: res.data });
      alert("Cập nhật thông tin thành công!");
      nav.goBack();
      
    } catch (ex) {
      setErr("Quá trình cập nhật thất bại. Vui lòng thử lại!");
      console.debug(ex);
    } finally {
      setLoading(false);
    }
  };

  const avatarUri = avatar?.uri ?? params?.profile?.avatar ?? null;

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={Styles.p15} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <Text variant="headlineSmall" style={[Styles.mb10, { fontWeight: "800", color: colors.black }]}>
          Chỉnh sửa thông tin
        </Text>

        {/* Khối chỉnh sửa Ảnh đại diện */}
        <Surface style={[Styles.p15, Styles.mb10, { backgroundColor: colors.white, borderRadius: 12 }]} elevation={1}>
          <Text variant="titleSmall" style={[Styles.mb10, { fontWeight: "700", color: colors.black }]}>
            Ảnh đại diện
          </Text>
          
          <AvatarPicker 
            title="Thay đổi ảnh đại diện..."
            avatarUri={avatarUri} 
            onImagePicked={(asset) => setAvatar(asset)} 
          />
           
        </Surface>

        {/* Khối nhập Form text động sử dụng Metadata */}
        <Surface style={[Styles.p15, Styles.mb10, { backgroundColor: colors.white, borderRadius: 12 }]} elevation={1}>
          <Text variant="titleSmall" style={[Styles.mb10, { fontWeight: "700", color: colors.black }]}>
            Thông tin cá nhân
          </Text>
          
          {err ? <HelperText type="error" visible={true} style={Styles.mb10}>{err}</HelperText> : null}
          
          {FIELDS.map((f) => (
            <TextInput
              key={f.field}
              label={f.label}
              mode="outlined"
              style={Styles.mb10}
              value={form[f.field]}
              onChangeText={(t) => update(f.field, t)}
              autoCapitalize="none"
              right={<TextInput.Icon icon={f.icon} />}
            />
          ))}
        </Surface>

        {/* Bộ nút xử lý hành động */}
        <Button 
          mode="contained" 
          onPress={save} 
          loading={loading} 
          disabled={loading}
          style={Styles.mt10} 
          contentStyle={{ paddingVertical: 6 }} 
          icon="content-save"
        >
          Lưu thay đổi
        </Button>

        <Button 
          mode="outlined" 
          onPress={() => nav.goBack()} 
          disabled={loading}
          style={Styles.mt10}
          contentStyle={{ paddingVertical: 6 }} 
          textColor={colors.gray}
        >
          Hủy bỏ
        </Button>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditProfileScreen;