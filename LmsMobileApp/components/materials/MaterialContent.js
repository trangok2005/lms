// components/materials/MaterialContent.js
import React from "react";
import { useWindowDimensions } from "react-native";
const MaterialContent = ({ htmlContent }) => {
  const { width } = useWindowDimensions();
  return (
    <RenderHtml 
      contentWidth={width} 
      source={{ html: htmlContent || "<p>Không có nội dung</p>" }} 
      tagsStyles={{
        p: { fontSize: 16, lineHeight: 24, color: '#333' },
        img: { maxWidth: '100%' }
      }}
    />
  );
};
export default MaterialContent;
