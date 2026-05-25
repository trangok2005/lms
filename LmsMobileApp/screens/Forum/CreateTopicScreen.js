import React, { useEffect, useState } from "react";
import {
  StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from "react-native";
import { Text, TextInput, Button, HelperText, Surface } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import Styles, { colors } from "../../styles/Styles";
import { Header, Loading } from "../../components/common";

const CreateTopicScreen = () => {
  const nav = useNavigation();
  const { params } = useRoute();
  const courseId = params?.courseId;
  const courseName = params?.courseName;

  const [courses,  setCourses]  = useState([]);
  const [form,     setForm]     = useState({ course: courseId ? courseId.toString() : "", title: "", content: "" });
  const [err,      setErr]      = useState("");
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(!courseId);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    if (courseId) {
      setFetching(false);
      return;
    }

    const fetchCourses = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const res   = await authApis(token).get(endpoints["my-courses"], {
          params: { status: "active" },
        });
        const data = res.data.results ?? res.data;
        setCourses(data.map((item) => ({
          label: item.course_name,
          value: item.course?.toString() ?? item.id?.toString() ?? "",
        })));
      } catch (ex) {
        console.debug(ex);
      } finally {
        setFetching(false);
      }
    };

    fetchCourses();
  }, [courseId]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const currentCourse = courseId ?? form.course;

  const validate = () => {
    if (!currentCourse)       { setErr("Vui lòng chọn khoá học!"); return false; }
    if (!form.title.trim())   { setErr("Vui lòng nhập tiêu đề!"); return false; }
    if (!form.content.trim()) { setErr("Vui lòng nhập nội dung!"); return false; }
    return true;
  };

  const submit = async () => {
    if (!validate()) return;
    setErr("");
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res   = await authApis(token).post(endpoints["forum-topics"](currentCourse), {
        title:   form.title.trim(),
        content: form.content.trim(),
      });
      nav.goBack();
    } catch (ex) {
      setErr("Tạo chủ đề thất bại, vui lòng thử lại!");
      console.debug(ex);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <Loading text="Đang tải khoá học..." />;

  const selectedCourse = courses.find((item) => item.value === form.course);
  const courseLabel = courseId ? (courseName ?? `Khóa học ${courseId}`) : selectedCourse?.label ?? "";
  const hasCoursePicker = !courseId;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <Header title="Tạo chủ đề mới" showBack />

      <ScrollView contentContainerStyle={Styles.p15} keyboardShouldPersistTaps="handled">

        <Surface style={styles.card} elevation={2}>

          <HelperText type="error" visible={!!err} style={Styles.mb10}>
            {err}
          </HelperText>

          <Text variant="bodyMedium" style={styles.label}>Khoá học *</Text>
          <TextInput
            label="Khoá học"
            mode="outlined"
            value={courseLabel}
            editable={false}
            right={hasCoursePicker ? <TextInput.Icon icon={showList ? "chevron-up" : "chevron-down"} /> : null}
            style={styles.input}
            onPressIn={hasCoursePicker ? () => setShowList((prev) => !prev) : undefined}
          />

          {hasCoursePicker && showList && (
            <Surface style={styles.listCard} elevation={1}>
              {courses.length === 0 ? (
                <Text variant="bodySmall" style={styles.emptyText}>
                  Không có khoá học nào.
                </Text>
              ) : (
                courses.map((item, idx) => (
                  <TouchableOpacity
                    key={`course-${item.value}-${idx}`}
                    activeOpacity={0.7}
                    style={styles.option}
                    onPress={() => {
                      update("course", item.value);
                      setShowList(false);
                    }}
                  >
                    <Text variant="bodyMedium" style={styles.optionText}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </Surface>
          )}

          <TextInput
            label="Tiêu đề *"
            mode="outlined"
            style={[Styles.mb10, styles.input]}
            value={form.title}
            onChangeText={(t) => update("title", t)}
            maxLength={255}
            right={<TextInput.Affix text={`${form.title.length}/255`} />}
          />

          <TextInput
            label="Nội dung *"
            mode="outlined"
            style={[Styles.mb10, styles.input]}
            value={form.content}
            onChangeText={(t) => update("content", t)}
            multiline
            numberOfLines={6}
          />

          <Button
            mode="contained"
            icon="send"
            onPress={submit}
            loading={loading}
            disabled={loading}
            style={[styles.button, Styles.mt10]}
            contentStyle={styles.buttonContent}
          >
            Đăng chủ đề
          </Button>

          <Button
            mode="outlined"
            onPress={() => nav.goBack()}
            disabled={loading}
            style={[styles.button, Styles.mt10]}
          >
            Huỷ
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 18,
  },
  label: {
    color: colors.gray,
    marginBottom: 10,
    fontWeight: "600",
  },
  input: {
    backgroundColor: colors.white,
  },
  listCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: {
    color: colors.black,
  },
  emptyText: {
    color: colors.gray,
    padding: 14,
  },
  button: {
    borderRadius: 10,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default CreateTopicScreen;