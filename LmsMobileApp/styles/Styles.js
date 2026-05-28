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
  focus: "#de3535"
};

export default StyleSheet.create({

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
  thumbnail: { width: "100%", height: 180, borderRadius: 10 },


  rowItem: {
    paddingVertical: 12, 
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: { marginLeft: 8 },
  rowValue: {
    fontWeight: "500",
    maxWidth: "55%",
    textAlign: "right",
  },


  appbar: {
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  headerTitle: {
    color: colors.red,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
  },
  notifWrapper: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  headerBadge: {
    position: "absolute",
    top: 6,
    right: 4,
    backgroundColor: "#FF4444",
    color: colors.white,
    fontSize: 10,
  },
  avatarHeaderBtn: {
    marginRight: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    borderRadius: 20,
  }
})