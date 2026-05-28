
import React from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";


const MaterialActions = ({ fileUrl, type }) => {
  return (
    <View style={{ marginVertical: 20 }}>
      <Button 
        mode="contained" 
        icon={type === 'video' ? "play" : "file-document"}
        onPress={() => fileUrl && Linking.openURL(fileUrl)}
      >
        {type === 'video' ? "Xem Video" : "Tải tài liệu"}
      </Button>
    </View>
  );
};
export default MaterialActions;
