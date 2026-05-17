import React, { useState } from "react";
import { StyleSheet, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Text, TextInput, Button, HelperText, Surface } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import Styles, { colors } from "../../styles/Styles";

const FIELDS = [
  { field: "old_password",     label: "Mật khẩu hiện tại"      },
  { field: "new_password",     label: "Mật khẩu mới"           },
  { field: "confirm_password", label: "Xác nhận mật khẩu mới"  },
];

const ChangePasswordScreen = () => {
  const nav = useNavigation();
  const [form, setForm]       = useState({});
  const [show, setShow]       = useState({});
  const [err, setErr]         = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const update     = (field, val) => setForm((p) => ({ ...p, [field]: val }));
  const toggleShow = (field)      => setShow((p) => ({ ...p, [field]: !p[field] }));

  const validate = () => {
    for (let f of FIELDS) {
      if (!form[f.field]?.trim()) { setErr(`Vui lòng nhập ${f.label}!`); return false; }
    }
    if (form.new_password.length < 6) {
      setErr("Mật khẩu mới phải có ít nhất 6 ký tự!"); return false;
    }
    if (form.new_password !== form.confirm_password) {
      setErr("Xác nhận mật khẩu không khớp!"); return false;
    }
    if (form.old_password === form.new_password) {
      setErr("Mật khẩu mới phải khác mật khẩu hiện tại!"); return false;
    }
    return true;
  };

  const changePassword = async () => {
    if (!validate()) return;
    setErr(""); setSuccess(""); setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      await authApis(token).post(endpoints["change-password"], {
        old_password: form.old_password,
        new_password: form.new_password,
      });
      setSuccess("Đổi mật khẩu thành công");
      setForm({});
      setTimeout(() => nav.goBack(), 1500);
    } catch (ex) {
      const msg = ex.response?.data?.detail
               ?? ex.response?.data?.old_password?.[0]
               ?? "Mật khẩu hiện tại không đúng!";
      setErr(msg);
      console.error(ex);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={Styles.p15} keyboardShouldPersistTaps="handled">

        <Text variant="headlineSmall" style={[styles.pageTitle, Styles.mb10]}>
          Đổi mật khẩu
        </Text>

        <Surface style={styles.card} elevation={1}>

          {/* Gợi ý */}
          <View style={styles.hintBox}>
            <Text variant="bodySmall" style={styles.hintText}>
              • Ít nhất 6 ký tự{"\n"}
              • Mật khẩu mới phải khác mật khẩu hiện tại
            </Text>
          </View>

          <HelperText type="error" visible={!!err}>{err}</HelperText>
          {!!success && (
            <HelperText type="info" visible style={{ color: colors.primary, fontWeight: "600" }}>
              {success}
            </HelperText>
          )}

          {FIELDS.map((f) => (
            <TextInput
              key={f.field}
              label={f.label}
              mode="outlined"
              style={Styles.mb10}
              value={form[f.field] ?? ""}
              onChangeText={(t) => update(f.field, t)}
              secureTextEntry={!show[f.field]}
              autoCapitalize="none"
              right={
                <TextInput.Icon
                  icon={show[f.field] ? "eye-off" : "eye"}
                  onPress={() => toggleShow(f.field)}
                />
              }
            />
          ))}

          <Button mode="contained" onPress={changePassword}
            loading={loading} disabled={loading} icon="lock-reset"
            style={[Styles.mt10, { borderRadius: 8 }]}
            contentStyle={{ paddingVertical: 4 }}>
            Xác nhận đổi mật khẩu
          </Button>

          <Button mode="outlined" onPress={() => nav.goBack()} disabled={loading}
            style={[Styles.mt10, { borderRadius: 8 }]}>
            Huỷ
          </Button>

        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  pageTitle: { fontWeight: "800", color: colors.black },
  card:      { borderRadius: 14, padding: 16, backgroundColor: colors.white },
  hintBox:   { backgroundColor: "#E8F5F0", borderRadius: 10, padding: 12, marginBottom: 12 },
  hintText:  { color: colors.primary, lineHeight: 20 },
});

export default ChangePasswordScreen;
