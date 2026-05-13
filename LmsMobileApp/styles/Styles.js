import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const colors = {
  primary: "#1D9E75",
  secondary: "#534AB7",
  danger: "#E24B4A",
  white: "#FFFFFF",
  black: "#1A1A1A",
  gray: "#888780",
  bg: "#F5F5F5",
  border: "#E0DDD5",
};

export default StyleSheet.create({
  // LAYOUT (
  container: { flex: 1, backgroundColor: colors.bg, padding: 15 },
  row: { flexDirection: "row", alignItems: "center" },
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  center: { alignItems: "center", justifyContent: "center" },
  
  margin: { margin: 10 },
  mt10: { marginTop: 10 },
  mb10: { marginBottom: 10 },
  p15: { padding: 15 },

  subject: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: colors.primary, 
    textAlign: "center",
    marginVertical: 10 
  },

  avatar: { width: 80, height: 80, borderRadius: 40, alignSelf: 'center' },
  thumbnail: { width: "100%", height: 180, borderRadius: 10 }
})