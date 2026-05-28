import React, { useContext, useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ImageBackground, Image } from "react-native"; // Thêm Image ở đây
import { Text, TextInput, Button, HelperText, Surface } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/MyContext";
import Styles, { colors } from "../../styles/Styles";

const FIELDS = [
  { field: "username", label: "Tên đăng nhập", icon: "account" },
  { field: "password", label: "Mật khẩu", icon: "eye", secure: true },
];

const Login = () => {
  const nav = useNavigation();
  const [, dispatch] = useContext(MyUserContext);

  const [form, setForm] = useState({});
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    for (let f of FIELDS) {
      if (!form[f.field]?.trim()) {
        setErr(`Vui lòng nhập ${f.label}!`);
        return false;
      }
    }
    return true;
  };

  const login = async () => {
    if (!validate()) return;
    setErr("");
    setLoading(true);
    try {
      const res = await Apis.post(endpoints["login"], {
        username:      form.username.trim(),
        password:      form.password.trim(),
      client_id:     "R8DsyMs5SOAm37yGXxDRJ9PXa09OXsTJXOaHDRnP",
        client_secret: "m7DnK2F0mcLyFAoHmIvf0MuyegDhTU6QAPcOUYzrDMprrF35js75sL7ga3qvMP0elSDZH2m29Im9vu5sWjUS16ebxrXm4ovIdNHOmXk70L3NzP9OiOF6u0HKMhX2sVxE",
        grant_type:    "password",
      });

      await AsyncStorage.setItem("token", res.data.access_token);
      const u = await authApis(res.data.access_token).get(endpoints["current-user"]);
      dispatch({ type: "LOGIN", payload: u.data });

    } catch (ex) {
      setErr("Tên đăng nhập hoặc mật khẩu không chính xác");
      console.debug(ex);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={{ uri: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1000&auto=format&fit=crop" }} 
      style={styles.fullBackground}
    >
      <View style={styles.fullOverlay}>
        <KeyboardAvoidingView
          style={styles.containerFlex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            keyboardShouldPersistTaps="handled" 
            showsVerticalScrollIndicator={false}
          >
            
            <View style={styles.brandContainer}>
              <View style={styles.logoRow}>
                <Text variant="displaySmall" style={[styles.brandTitle, {color: "#534AB7" }]}>
                  LMS-T&N
                </Text>
              </View>
              <Text variant="bodyLarge" style={styles.brandSub}>
                Học đi fen do dự trời tốt mất
              </Text>
            </View>

            <Surface style={styles.loginCard} elevation={4}>
              <Text variant="headlineSmall" style={styles.cardHeader}>Đăng nhập</Text>
              
              {err ? (
                <HelperText type="error" visible={true} style={styles.errorText}>
                  {err}
                </HelperText>
              ) : null}

              {FIELDS.map((f) => (
                <TextInput
                  key={f.field}
                  label={f.label}
                  mode="outlined"
                  style={Styles.mb10}
                  textColor={colors.black}
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                  value={form[f.field] ?? ""}
                  onChangeText={(t) => update(f.field, t)}
                  secureTextEntry={f.secure && !showPass}
                  autoCapitalize="none"
                  right={
                    f.secure ? (
                      <TextInput.Icon
                        icon={showPass ? "eye-off" : "eye"}
                        onPress={() => setShowPass((v) => !v)}
                      />
                    ) : (
                      <TextInput.Icon icon={f.icon} color={colors.gray} />
                    )
                  }
                />
              ))}

              <Button
                mode="contained"
                onPress={login}
                loading={loading}
                disabled={loading}
                style={[Styles.mt10, styles.submitBtn]}
                contentStyle={styles.btnContent}
              >
                Đăng nhập
              </Button>
            </Surface>

            <Button
              mode="text"
              onPress={() => nav.navigate("Register")}
              style={styles.registerLink}
              labelStyle={{ color: "#de3535" }}
            >
              Chưa có tài khoản? Đăng ký ngay
            </Button>

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  fullBackground: { flex: 1, width: "100%", height: "100%" },
  fullOverlay: { flex: 1, backgroundColor: "rgba(26, 26, 26, 0.65)" },
  containerFlex: { flex: 1 },
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  

  brandContainer: { alignItems: "center", marginBottom: 40 },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",   
    justifyContent: "center",
    marginBottom: 12,
    gap: 12,                
  },
  customLogo: {
    width: 45,             // Chiều rộng logo ảnh
    height: 45,            // Chiều cao bằng chiều rộng tạo tỉ lệ vuông 1:1
    borderRadius: 8,       // Bo góc nhẹ cho viền logo ảnh nhìn mượt
    resizeMode: "contain"  // Đảm bảo ảnh tự co giãn vừa vặn khung, không bị méo chữ hay hình
  },
  brandTitle: { 
    fontWeight: "900", 
    color: colors.white,
    letterSpacing: 1,
    paddingHorizontal: 16,  
    paddingVertical: 4,     
    borderRadius: 12,       
    overflow: "hidden",     
  },
  brandSub: { 
    color: "rgba(255, 255, 255, 0.9)", 
    marginTop: 10,
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 24,         
    paddingHorizontal: 20,
  },


  loginCard: { 
    borderRadius: 20, 
    padding: 24, 
    backgroundColor: "rgba(255, 255, 255, 0.95)", 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  cardHeader: { fontWeight: "800", color: colors.black, marginBottom: 16 },
  errorText: { paddingHorizontal: 0, marginBottom: 10 },
  submitBtn: { borderRadius: 8, backgroundColor: colors.primary },
  btnContent: { paddingVertical: 6 },
  registerLink: { 
    marginTop: 24,
    alignSelf: "center",
    textDecorationLine: "underline"
  },
});

export default Login;
