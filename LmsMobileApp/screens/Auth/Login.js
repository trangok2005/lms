import React, { useContext, useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from "react-native";
import { Text, TextInput, Button, HelperText, Surface } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/MyContext";

const FIELDS = [
  { field: "username", label: "Tên đăng nhập", icon: "account" },
  { field: "password", label: "Mật khẩu", icon: "eye",secure: true },
];

const Login = () => {
  const nav = useNavigation();
  const [, dispatch] = useContext(MyUserContext);

  const [form, setForm]       = useState({});
  const [err, setErr]         = useState("");
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
        username:      form.username,
        password:      form.password,
        client_id:     "hmIMxDFqFX7mMMS8RRcESlA06GcL8lhNaoIz6KPM",
        client_secret: "BiQpZbG90XGs1IfP7EMN3EzZBxI9Bj4p3h10XtQFv78icwNB8VAOtOJ8z7Wy6jMcq2yvsYnGetUUdyV55EuNncrwOntK1rLRThUfLtIaqcHuxlDceH3Zw4nKpFSRgebU",
        grant_type:    "password",
      });

      await AsyncStorage.setItem("token", res.data.access_token);

      const u = await authApis(res.data.access_token).get(endpoints["current-user"]);
      //console.log(u.data)
      dispatch({ type: "LOGIN", payload: u.data });


    } catch (ex) {
      setErr("Tên đăng nhập hoặc mật khẩu không chính xác!");
      console.error(ex);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo / Brand */}
        <View style={styles.brand}>
          <Text variant="headlineMedium" style={styles.brandTitle}>📚 LMS</Text>
          <Text variant="bodyMedium" style={styles.brandSub}>Chào mừng bạn quay lại!</Text>
        </View>

        {/* Card form */}
        <Surface style={styles.card} elevation={2}>
          <Text variant="titleLarge" style={styles.cardTitle}>Đăng nhập</Text>

          {/* Error */}
          <HelperText type="error" visible={!!err} style={styles.helperText}>
            {err}
          </HelperText>

          {/* Fields */}
          {FIELDS.map((f) => (
            <TextInput
              key={f.field}
              label={f.label}
              mode="outlined"
              style={styles.input}
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
                  <TextInput.Icon icon={f.icon} />
                )
              }
            />
          ))}

          {/* Login button */}
          <Button
            mode="contained"
            onPress={login}
            loading={loading}
            disabled={loading}
            style={styles.btnPrimary}
            contentStyle={styles.btnContent}
          >
            Đăng nhập
          </Button>
        </Surface>

        {/* Navigate to Register */}
        <Button
          mode="text"
          onPress={() => nav.navigate("Register")}
          style={styles.btnText}
        >
          Chưa có tài khoản? Đăng ký ngay
        </Button>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex:       { flex: 1, backgroundColor: "#F5F5F5" },
  scroll:     { flexGrow: 1, justifyContent: "center", padding: 24 },
  brand:      { alignItems: "center", marginBottom: 32 },
  brandTitle: { fontWeight: "800", color: "#6C63FF" },
  brandSub:   { color: "#757575", marginTop: 4 },
  card:       { borderRadius: 16, padding: 24, backgroundColor: "#fff" },
  cardTitle:  { fontWeight: "700", marginBottom: 8, color: "#212121" },
  helperText: { marginBottom: 4 },
  input:      { marginBottom: 12 },
  btnPrimary: { marginTop: 8, borderRadius: 8 },
  btnContent: { paddingVertical: 4 },
  btnText:    { marginTop: 16 },
});

export default Login;