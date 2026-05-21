const MaterialHeader = ({ title, type, difficulty }) => (
  <View style={{ marginBottom: 15 }}>
    <Text variant="headlineSmall">{title}</Text>
    <View style={{ flexDirection: 'row', gap: 10 }}>
        <Text variant="labelLarge">Loại: {type}</Text>
        <Text variant="labelLarge">Độ khó: {difficulty}</Text>
    </View>
  </View>
);
