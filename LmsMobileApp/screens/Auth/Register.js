import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Styles from "../../styles/Styles";
import { Button, HelperText, TextInput } from "react-native-paper";
import * as ImgPicker from 'expo-image-picker';
import { useState } from "react";
import Apis, { endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import {AvatarPicker} from "../../components/common/index"

const Register = () => {
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
        field: 'password',
        label: 'Mật khẩu',
        icon: 'eye',
        secureTextEntry: true
    }, {
        field: 'confirm',
        label: 'Xác nhận mật khẩu',
        icon: 'eye',
        secureTextEntry: true
    }];

    const [user, setUser] = useState({});
    const [err, setErr] = useState();
    const [loading, setLoading] = useState(false);
    const nav = useNavigation();

    const validate = () => {
        for (let i of userInfo)
            if (!(i.field in user) || !user[i.field]) {
                setErr(`Vui lòng nhập ${i.label}!`);
                return false;
            } 
            
        if (user.password !== user.confirm) {
            setErr("Mật khẩu xác nhận không khớp!");
            return false;
        }

        return true;
    }

    const register = async () => {
        if (validate()) {
            setErr("");
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
                setErr("Lỗi hệ thống hoặc tên đăng nhập đã tồn tại!");
                console.debug(ex);
            } finally {
                setLoading(false);
            }
        }
    }

    return (
        <ScrollView style={Styles.container}>
            <View style={Styles.center}>
                <Text style={Styles.title}>ĐĂNG KÝ HỆ THỐNG</Text>
            </View>

            {err && <HelperText type="error" visible={err}>{err}</HelperText>}
            
            {userInfo.map(i => (
                <TextInput 
                    key={i.field} 
                    style={Styles.mb10} 
                    value={user[i.field]} 
                    onChangeText={t => setUser({...user, [i.field]: t})}
                    label={i.label}
                    secureTextEntry={i.secureTextEntry}
                    right={<TextInput.Icon icon={i.icon} />}
                    mode="outlined"
                />
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