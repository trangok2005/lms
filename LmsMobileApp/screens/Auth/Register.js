import { Image, ScrollView, Text, View } from "react-native";
import Styles from "../../styles/Styles";
import { Button, HelperText, TextInput } from "react-native-paper";
import { useState } from "react";
import Apis, { endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import { AvatarPicker } from "../../components/common/index";

const Register = () => {
    // 1. Tạo 2 state quản lý việc ẩn/hiện (secureTextEntry) cho Mật khẩu và Xác nhận mật khẩu
    const [securePassword, setSecurePassword] = useState(true);
    const [secureConfirm, setSecureConfirm] = useState(true);

    const userInfo = [{
        field: 'first_name',
        label: 'Tên',
        icon: 'text-short'
    }, {
        field: 'last_name',
        label: 'Họ và tên lót',
        icon: 'text'
    }, {
        field: 'username',
        label: 'Tên đăng nhập',
        icon: 'account'
    }, {
        field: 'email',
        label: 'Email',
        icon: 'email'
    }, {
        field: 'password',
        label: 'Mật khẩu',
        icon: securePassword ? 'eye-off' : 'eye', // Thay đổi icon tương ứng
        secureTextEntry: securePassword,
        onIconPress: () => setSecurePassword(!securePassword) // Sự kiện click vào icon
    }, {
        field: 'confirm',
        label: 'Xác nhận mật khẩu',
        icon: secureConfirm ? 'eye-off' : 'eye',
        secureTextEntry: secureConfirm,
        onIconPress: () => setSecureConfirm(!secureConfirm)
    }];

    const [user, setUser] = useState({});
    const [err, setErr] = useState({}); 
    const [loading, setLoading] = useState(false);
    const nav = useNavigation();

    const validate = () => {
        let currentErrors = {};

        for (let i of userInfo) {
            if (!(i.field in user) || !user[i.field]) {
                currentErrors[i.field] = `Vui lòng nhập ${i.label}!`;
            } 
        }
        
        if (user.password && user.confirm && user.password !== user.confirm) {
            currentErrors['confirm'] = "Mật khẩu xác nhận không khớp!";
        }

        if (Object.keys(currentErrors).length > 0) {
            setErr(currentErrors)
            return false;
        }

        return true;
    }

    const register = async () => {
        if (validate()) {
            setErr({}); // Reset sạch lỗi cũ trước khi gửi request mới
            try {
                setLoading(true);

                let form = new FormData();
                for (let key in user) {
                    if (key !== 'confirm') {
                        if (key === 'avatar') {
                            form.append('avatar', {
                                uri: user.avatar.uri,
                                name: user.avatar.fileName || 'avatar.jpg',
                                type: 'image/jpeg'
                            });
                        } else {
                            form.append(key, user[key]);
                        }
                    }
                }

                let res = await Apis.post(endpoints['register'], form, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (res.status === 201) {
                    alert("Đăng ký thành công!");
                    nav.navigate('Login');
                }
            } catch (ex) {
                if (ex.response && ex.response.data) {
                    setErr(ex.response.data);
                } else {
                    setErr({ general: "Lỗi hệ thống hoặc không thể kết nối đến máy chủ" });
                }
                console.debug(ex);
            } finally {
                setLoading(false);
            }
        }
    }

    return (
        <ScrollView style={Styles.container}>
            <View style={Styles.center}>
                <Text style={[Styles.headerTitle, Styles.p15]}>ĐĂNG KÝ HỆ THỐNG</Text>
            </View>

          
            {err && err.general && (
                <HelperText type="error" visible={true}>{err.general}</HelperText>
            )}
            
            {userInfo.map(i => (
                <View key={i.field} style={Styles.mb10}>
                    <TextInput 
                        value={user[i.field] || ''} 
                        onChangeText={t => {
                            setUser({...user, [i.field]: t});
                            if (err && err[i.field]) {
                                setErr({...err, [i.field]: null});
                            }
                        }}
                        label={i.label}
                        secureTextEntry={i.secureTextEntry}
                        right={
                            i.icon ? (
                                <TextInput.Icon 
                                    icon={i.icon} 
                                    onPress={i.onIconPress ? i.onIconPress : null} 
                                />
                            ) : null
                        }
                        mode="outlined"
                        error={err && !!err[i.field]}
                    />
                    
    
                    {err && err[i.field] && (
                        <HelperText type="error" visible={true}>
                            {Array.isArray(err[i.field]) ? err[i.field].join(', ') : err[i.field]}
                        </HelperText>
                    )}
                </View>
            ))}

            <AvatarPicker 
                title="Chọn ảnh đại diện..."
                avatarUri={user?.avatar?.uri} 
                onImagePicked={(asset) => setUser({ ...user, 'avatar': asset })}
            />

            {user.avatar && (
                <View style={Styles.center}>
                    <Image source={{uri: user.avatar.uri}} style={[Styles.avatar, Styles.mb10]} />
                </View>
            )}

            <Button 
                loading={loading} 
                disabled={loading} 
                onPress={register} 
                style={Styles.mt10} 
                mode="contained"
            >
                Đăng ký tài khoản
            </Button>
        </ScrollView>
    );
}

export default Register;